import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewAppointmentModal, findConflict, addMinutes } from './NewAppointmentModal';
import { Appointment, ServiceItem, Student } from '../types';
import { toLocalDateKey } from '../utils/dates';

const today = toLocalDateKey(new Date());

const services: ServiceItem[] = [
  { id: 'serv-1', name: 'Personal Trainer 1h', description: '', price: 150, durationMinutes: 60, active: true, modality: 'Presencial', iconName: 'fitness_center' },
  { id: 'serv-2', name: 'Avaliação 30min', description: '', price: 80, durationMinutes: 30, active: true, modality: 'Presencial', iconName: 'school' },
];

const students: Student[] = [
  { id: 'std-1', name: 'Mariana Costa', email: 'mariana@teste.com', phone: '(11) 98765-4321', avatar: 'a.png', joinedDate: 'Março 2025', totalClasses: 3, status: 'Ativo' },
];

const existing: Appointment[] = [
  { id: 'apt-1', studentName: 'João Pedro', serviceId: 'serv-1', serviceName: 'Personal Trainer 1h', date: today, dayOfWeek: 1, startTime: '10:00', endTime: '11:00', durationMinutes: 60, modality: 'Presencial', status: 'Confirmado', price: 150 },
  { id: 'block-1', studentName: '[Bloqueado] Almoço', serviceId: 'block', serviceName: 'Almoço', date: today, dayOfWeek: 1, startTime: '12:00', endTime: '13:00', durationMinutes: 60, modality: 'Presencial', status: 'Bloqueado', price: 0 },
  { id: 'apt-old', studentName: 'Cancelada', serviceId: 'serv-1', serviceName: 'Personal Trainer 1h', date: today, dayOfWeek: 1, startTime: '15:00', endTime: '16:00', durationMinutes: 60, modality: 'Presencial', status: 'Cancelado', price: 150 },
];

function renderModal(extra: Partial<React.ComponentProps<typeof NewAppointmentModal>> = {}) {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(
    <NewAppointmentModal
      isOpen
      onClose={onClose}
      services={services}
      students={students}
      onSave={onSave}
      existingAppointments={existing}
      {...extra}
    />
  );
  return { onSave, onClose };
}

const fill = (name: string, time: string) => {
  fireEvent.change(screen.getByLabelText(/nome do aluno/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/horário de início/i), { target: { value: time } });
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: /confirmar (re)?agendamento/i }));

describe('helpers de horário', () => {
  it('soma minutos ao horário', () => {
    expect(addMinutes('14:00', 60)).toBe('15:00');
    expect(addMinutes('09:45', 30)).toBe('10:15');
    expect(addMinutes('23:30', 60)).toBe('00:30');
  });

  it('detecta sobreposição no mesmo dia, ignora cancelados e o próprio id', () => {
    expect(findConflict({ date: today, startTime: '10:30', endTime: '11:30' }, existing)?.id).toBe('apt-1');
    expect(findConflict({ date: today, startTime: '11:00', endTime: '12:00' }, existing)).toBeNull();
    expect(findConflict({ date: today, startTime: '12:30', endTime: '13:30' }, existing)?.id).toBe('block-1');
    expect(findConflict({ date: today, startTime: '15:00', endTime: '16:00' }, existing)).toBeNull();
    expect(findConflict({ id: 'apt-1', date: today, startTime: '10:00', endTime: '11:00' }, existing)).toBeNull();
    expect(findConflict({ date: '2030-01-01', startTime: '10:00', endTime: '11:00' }, existing)).toBeNull();
  });
});

describe('novo agendamento', () => {
  it('abre com a data de hoje, não com uma data fixa', () => {
    renderModal();
    expect(screen.getByLabelText(/^data$/i)).toHaveValue(today);
  });

  it('recusa horário que choca com outra aula e explica o motivo', () => {
    const { onSave } = renderModal();
    fill('Mariana Costa', '10:30');
    submit();
    expect(screen.getByRole('alert')).toHaveTextContent(/aula de João Pedro/i);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('recusa horário dentro de um bloqueio', () => {
    const { onSave } = renderModal();
    fill('Mariana Costa', '12:30');
    submit();
    expect(screen.getByRole('alert')).toHaveTextContent(/horário bloqueado/i);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('salva em horário livre com fim calculado pela duração do serviço e dados do aluno conhecido', () => {
    const { onSave, onClose } = renderModal();
    fill('Mariana Costa', '11:00');
    submit();

    expect(onSave).toHaveBeenCalledTimes(1);
    const apt: Appointment = onSave.mock.calls[0][0];
    expect(apt).toMatchObject({
      studentName: 'Mariana Costa',
      studentPhone: '(11) 98765-4321',
      studentEmail: 'mariana@teste.com',
      serviceId: 'serv-1',
      date: today,
      startTime: '11:00',
      endTime: '12:00',
      durationMinutes: 60,
      status: 'Confirmado',
      price: 150,
      clientSince: 'Cliente desde Março 2025',
    });
    expect(apt.dayOfWeek).toBe(new Date().getDay());
    expect(onClose).toHaveBeenCalled();
  });

  it('aluno desconhecido não recebe telefone inventado', () => {
    const { onSave } = renderModal();
    fill('Pessoa Nova', '16:00');
    submit();
    const apt: Appointment = onSave.mock.calls[0][0];
    expect(apt.studentPhone).toBeUndefined();
    expect(apt.studentEmail).toBeUndefined();
    expect(apt.id).toMatch(/^apt-/);
  });

  it('reagendar carrega a aula, mantém o id e o preço, e permite mover o horário', () => {
    const editing = existing[0];
    const { onSave } = renderModal({ editingAppointment: editing });
    expect(screen.getByRole('heading', { name: /reagendar aula/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nome do aluno/i)).toHaveValue('João Pedro');
    expect(screen.getByLabelText(/horário de início/i)).toHaveValue('10:00');

    fireEvent.change(screen.getByLabelText(/horário de início/i), { target: { value: '14:00' } });
    submit();

    const apt: Appointment = onSave.mock.calls[0][0];
    expect(apt.id).toBe('apt-1');
    expect(apt.startTime).toBe('14:00');
    expect(apt.endTime).toBe('15:00');
    expect(apt.price).toBe(150);
  });

  it('reagendar para cima de outra aula é recusado', () => {
    const { onSave } = renderModal({ editingAppointment: existing[0] });
    fireEvent.change(screen.getByLabelText(/horário de início/i), { target: { value: '12:00' } });
    submit();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
