import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { AgendaView } from './AgendaView';
import { Appointment, ServiceItem, TeacherProfile } from '../types';

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
  { id: 'serv-1', name: 'Personal Trainer 1h', description: '', price: 150, durationMinutes: 60, active: true, modality: 'Presencial', iconName: 'fitness_center' },
];

const active: Appointment = {
  id: 'apt-ativa', studentName: 'Mariana Costa', serviceId: 'serv-1', serviceName: 'Personal Trainer 1h',
  date: '2026-09-07', dayOfWeek: 1, startTime: '10:00', endTime: '11:00', durationMinutes: 60,
  modality: 'Presencial', status: 'Confirmado', price: 150,
};

const cancelled: Appointment = {
  id: 'apt-cancelada', studentName: 'João Pedro', serviceId: 'serv-1', serviceName: 'Personal Trainer 1h',
  date: '2026-09-08', dayOfWeek: 2, startTime: '14:00', endTime: '15:00', durationMinutes: 60,
  modality: 'Presencial', status: 'Cancelado', price: 150,
  cancelledAt: '2026-09-04', cancellationReason: 'Aluno viajou',
};

function renderAgenda(appointments: Appointment[], selected: Appointment | null = null) {
  const onCancelAppointment = vi.fn();
  const onReopenAppointment = vi.fn();
  const onDeleteAppointment = vi.fn();
  render(
    <AgendaView
      appointments={appointments}
      services={services}
      currentTeacher={teacher}
      selectedAppointment={selected}
      onSelectAppointment={vi.fn()}
      onUpdateAppointmentNotes={vi.fn()}
      onCancelAppointment={onCancelAppointment}
      onReopenAppointment={onReopenAppointment}
      onDeleteAppointment={onDeleteAppointment}
      onRescheduleAppointment={vi.fn()}
      onOpenNewAppointmentModal={vi.fn()}
      onOpenGoogleCalendarModal={vi.fn()}
      onOpenWhatsApp8hModal={vi.fn()}
    />
  );
  return { onCancelAppointment, onReopenAppointment, onDeleteAppointment };
}

const history = () => screen.getByRole('region', { name: /histórico de cancelamentos/i });

describe('agenda: histórico de cancelamentos', () => {
  it('aula cancelada sai da grade e aparece no histórico com data e motivo', () => {
    renderAgenda([active, cancelled]);
    const panel = history();
    expect(within(panel).getByText(/joão pedro/i)).toBeInTheDocument();
    expect(within(panel).getByText(/cancelada em 04\/09\/2026/i)).toBeInTheDocument();
    expect(within(panel).getByText(/aluno viajou/i)).toBeInTheDocument();
    expect(within(panel).queryByText(/mariana costa/i)).not.toBeInTheDocument();
  });

  it('o contador do filtro mostra quantas foram canceladas', () => {
    renderAgenda([active, cancelled]);
    expect(screen.getByRole('button', { name: /canceladas \(1\)/i })).toBeInTheDocument();
  });

  it('sem cancelamentos o histórico não ocupa espaço, mas abre pelo filtro', () => {
    renderAgenda([active]);
    expect(screen.queryByRole('region', { name: /histórico de cancelamentos/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /canceladas \(0\)/i }));
    expect(within(history()).getByText(/nenhuma aula cancelada/i)).toBeInTheDocument();
  });

  it('cancelar pede confirmação e envia o motivo digitado', () => {
    const { onCancelAppointment } = renderAgenda([active], active);
    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));

    const dialog = screen.getByRole('dialog', { name: /cancelar aula/i });
    fireEvent.change(within(dialog).getByLabelText(/motivo/i), { target: { value: 'Professor doente' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /confirmar cancelamento/i }));

    expect(onCancelAppointment).toHaveBeenCalledWith('apt-ativa', 'Professor doente');
  });

  it('voltar na confirmação não cancela nada', () => {
    const { onCancelAppointment } = renderAgenda([active], active);
    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^voltar$/i }));
    expect(onCancelAppointment).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: /cancelar aula/i })).not.toBeInTheDocument();
  });

  it('aula cancelada oferece reabrir e excluir, não cancelar de novo', () => {
    const { onReopenAppointment } = renderAgenda([cancelled], cancelled);
    // a data aparece no histórico e no painel de detalhes; aqui basta que exista
    expect(screen.getAllByText(/cancelada em 04\/09\/2026/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/motivo: aluno viajou/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /^cancelar$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reabrir aula/i }));
    expect(onReopenAppointment).toHaveBeenCalledWith('apt-cancelada');
  });

  it('excluir do histórico pede confirmação', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { onDeleteAppointment } = renderAgenda([cancelled], cancelled);
    fireEvent.click(screen.getByRole('button', { name: /excluir do histórico/i }));
    expect(window.confirm).toHaveBeenCalled();
    expect(onDeleteAppointment).toHaveBeenCalledWith('apt-cancelada');
    vi.restoreAllMocks();
  });
});
