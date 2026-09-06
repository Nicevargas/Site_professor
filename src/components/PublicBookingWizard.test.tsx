import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PublicBookingWizard } from './PublicBookingWizard';
import { Appointment, ServiceItem, TeacherProfile } from '../types';
import { nextBusinessDays } from '../utils/dates';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const teacher: TeacherProfile = {
  id: 'prof-roberto',
  name: 'Prof. Roberto Almeida',
  role: 'Personal Trainer',
  specialty: 'Treino',
  bio: '',
  rating: 5,
  reviewCount: 1,
  yearsExperience: 1,
  avatarUrl: '',
  heroImageUrl: '',
  whatsapp: '5511999999999',
  email: 'roberto@teste.com',
};

const services: ServiceItem[] = [
  { id: 'serv-1', name: 'Personal Trainer 1h', description: 'Sessão individual', price: 150, durationMinutes: 60, active: true, modality: 'Presencial', iconName: 'fitness_center' },
];

// Mesmo serviço, mas em turma de 3 alunos
const groupServices: ServiceItem[] = [
  { ...services[0], name: 'Natação em turma', capacity: 3 },
];

const firstDay = nextBusinessDays(5)[0];

function busyAt(time: string, endTime: string, status: Appointment['status'] = 'Confirmado'): Appointment {
  return { id: `busy-${time}`, studentName: 'Outro aluno', serviceId: 'serv-1', serviceName: 'Personal Trainer 1h', date: firstDay.date, dayOfWeek: firstDay.dayOfWeek, startTime: time, endTime, durationMinutes: 60, modality: 'Presencial', status, price: 150 };
}

function renderWizard(existingAppointments: Appointment[] = [], catalog: ServiceItem[] = services) {
  const onBookingComplete = vi.fn();
  const onJoinWaitlist = vi.fn();
  render(
    <PublicBookingWizard
      teacher={teacher}
      services={catalog}
      preSelectedServiceId="serv-1"
      existingAppointments={existingAppointments}
      onBookingComplete={onBookingComplete}
      onJoinWaitlist={onJoinWaitlist}
      onBackToLanding={vi.fn()}
      onBackToDashboard={vi.fn()}
    />
  );
  return { onBookingComplete, onJoinWaitlist };
}

/** Preenche o passo 3 e envia. */
function fillAndSubmit(name = 'Ana Souza', phone = '11988887777') {
  fireEvent.click(screen.getByRole('button', { name: /continuar|avançar|próximo/i }));
  fireEvent.change(screen.getByPlaceholderText(/gabriela santos/i), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText(/\(11\) 98765-4321/), { target: { value: phone } });
  fireEvent.click(screen.getByRole('button', { name: /finalizar agendamento/i }));
}

const slotButton = (time: string) => screen.queryByRole('button', { name: new RegExp(`^${time}`) });

describe('agendamento pelo site público', () => {
  it('oferece dias futuros, não datas fixas do passado', () => {
    renderWizard();
    expect(screen.getByRole('button', { name: new RegExp(firstDay.label, 'i') })).toBeInTheDocument();
    expect(screen.queryByText(/2024/)).not.toBeInTheDocument();
  });

  it('esconde horário bloqueado e marca o lotado como lista de espera', () => {
    renderWizard([busyAt('09:00', '10:00'), busyAt('14:00', '15:00', 'Bloqueado')]);
    // Bloqueio não é vaga: some da lista
    expect(slotButton('14:00')).not.toBeInTheDocument();
    // Aula cheia continua visível, mas avisando que ali só entra na fila
    expect(slotButton('09:00')).toHaveTextContent(/lista de espera/i);
    expect(slotButton('10:30')).toBeInTheDocument();
    expect(slotButton('17:00')).toBeInTheDocument();
  });

  it('turma com vagas mostra quantas sobraram', () => {
    renderWizard([busyAt('09:00', '10:00')], groupServices);
    expect(slotButton('09:00')).toHaveTextContent(/2 vaga/i);
    expect(slotButton('09:00')).not.toHaveTextContent(/lista de espera/i);
  });

  it('turma lotada manda para a lista de espera em vez de agendar', () => {
    const { onBookingComplete, onJoinWaitlist } = renderWizard(
      [busyAt('09:00', '10:00'), busyAt('09:00', '10:00'), busyAt('09:00', '10:00')].map((a, i) => ({ ...a, id: `busy-${i}` })),
      groupServices
    );
    fireEvent.click(slotButton('09:00')!);
    fillAndSubmit('Bruno Lima');

    expect(onBookingComplete).not.toHaveBeenCalled();
    expect(onJoinWaitlist).toHaveBeenCalledTimes(1);
    expect(onJoinWaitlist.mock.calls[0][0]).toMatchObject({
      serviceId: 'serv-1',
      date: firstDay.date,
      startTime: '09:00',
      studentName: 'Bruno Lima',
    });
    expect(screen.getByText(/você entrou na lista de espera/i)).toBeInTheDocument();
  });

  it('turma com vaga sobrando agenda normalmente, sem fila', () => {
    const { onBookingComplete, onJoinWaitlist } = renderWizard([busyAt('09:00', '10:00')], groupServices);
    fireEvent.click(slotButton('09:00')!);
    fillAndSubmit('Carla Dias');

    expect(onJoinWaitlist).not.toHaveBeenCalled();
    expect(onBookingComplete).toHaveBeenCalledTimes(1);
    expect(onBookingComplete.mock.calls[0][0].startTime).toBe('09:00');
  });

  it('aula cancelada libera o horário de novo', () => {
    renderWizard([busyAt('09:00', '10:00', 'Cancelado')]);
    expect(slotButton('09:00')).toBeInTheDocument();
  });

  it('avisa quando o dia inteiro está bloqueado', () => {
    renderWizard([
      busyAt('09:00', '10:00', 'Bloqueado'), busyAt('10:30', '11:30', 'Bloqueado'),
      busyAt('14:00', '15:00', 'Bloqueado'), busyAt('15:30', '16:30', 'Bloqueado'),
      busyAt('17:00', '18:00', 'Bloqueado'),
    ]);
    expect(screen.getByText(/não há horários livres neste dia/i)).toBeInTheDocument();
  });

  it('avisa quando todas as turmas do dia lotaram', () => {
    renderWizard([
      busyAt('09:00', '10:00'), busyAt('10:30', '11:30'), busyAt('14:00', '15:00'),
      busyAt('15:30', '16:30'), busyAt('17:00', '18:00'),
    ]);
    expect(screen.getByText(/todas as turmas deste dia estão lotadas/i)).toBeInTheDocument();
  });

  it('conclui a reserva com data futura e sem e-mail inventado', () => {
    const { onBookingComplete } = renderWizard();
    fireEvent.click(slotButton('10:30')!);
    fillAndSubmit();

    expect(onBookingComplete).toHaveBeenCalledTimes(1);
    const apt: Appointment = onBookingComplete.mock.calls[0][0];
    expect(apt.date).toBe(firstDay.date);
    expect(apt.startTime).toBe('10:30');
    expect(apt.endTime).toBe('11:30');
    expect(apt.studentName).toBe('Ana Souza');
    expect(apt.studentEmail).toBeUndefined();
    expect(apt.clientSince).not.toContain('2024');
  });
});
