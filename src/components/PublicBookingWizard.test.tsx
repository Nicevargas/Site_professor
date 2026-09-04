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

const firstDay = nextBusinessDays(5)[0];

function busyAt(time: string, endTime: string, status: Appointment['status'] = 'Confirmado'): Appointment {
  return { id: `busy-${time}`, studentName: 'Outro aluno', serviceId: 'serv-1', serviceName: 'Personal Trainer 1h', date: firstDay.date, dayOfWeek: firstDay.dayOfWeek, startTime: time, endTime, durationMinutes: 60, modality: 'Presencial', status, price: 150 };
}

function renderWizard(existingAppointments: Appointment[] = []) {
  const onBookingComplete = vi.fn();
  render(
    <PublicBookingWizard
      teacher={teacher}
      services={services}
      preSelectedServiceId="serv-1"
      existingAppointments={existingAppointments}
      onBookingComplete={onBookingComplete}
      onBackToLanding={vi.fn()}
      onBackToDashboard={vi.fn()}
    />
  );
  return { onBookingComplete };
}

const slotButton = (time: string) => screen.queryByRole('button', { name: new RegExp(`^${time}`) });

describe('agendamento pelo site público', () => {
  it('oferece dias futuros, não datas fixas do passado', () => {
    renderWizard();
    expect(screen.getByRole('button', { name: new RegExp(firstDay.label, 'i') })).toBeInTheDocument();
    expect(screen.queryByText(/2024/)).not.toBeInTheDocument();
  });

  it('esconde horários já ocupados por aula ou bloqueio', () => {
    renderWizard([busyAt('09:00', '10:00'), busyAt('14:00', '15:00', 'Bloqueado')]);
    expect(slotButton('09:00')).not.toBeInTheDocument();
    expect(slotButton('14:00')).not.toBeInTheDocument();
    expect(slotButton('10:30')).toBeInTheDocument();
    expect(slotButton('17:00')).toBeInTheDocument();
  });

  it('aula cancelada libera o horário de novo', () => {
    renderWizard([busyAt('09:00', '10:00', 'Cancelado')]);
    expect(slotButton('09:00')).toBeInTheDocument();
  });

  it('avisa quando o dia não tem horário livre', () => {
    renderWizard([
      busyAt('09:00', '10:00'), busyAt('10:30', '11:30'), busyAt('14:00', '15:00'),
      busyAt('15:30', '16:30'), busyAt('17:00', '18:00'),
    ]);
    expect(screen.getByText(/não há horários livres neste dia/i)).toBeInTheDocument();
  });

  it('conclui a reserva com data futura e sem e-mail inventado', () => {
    const { onBookingComplete } = renderWizard();
    fireEvent.click(slotButton('10:30')!);
    fireEvent.click(screen.getByRole('button', { name: /continuar|avançar|próximo/i }));

    fireEvent.change(screen.getByPlaceholderText(/gabriela santos/i), { target: { value: 'Ana Souza' } });
    fireEvent.change(screen.getByPlaceholderText(/\(11\) 98765-4321/), { target: { value: '11988887777' } });
    fireEvent.click(screen.getByRole('button', { name: /finalizar agendamento/i }));

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
