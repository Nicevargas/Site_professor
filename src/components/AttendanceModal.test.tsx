import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { AttendanceModal } from './AttendanceModal';
import { ClassesAndWaitlistPanel } from './ClassesAndWaitlistPanel';
import { Appointment, ServiceItem, Student, WaitlistEntry } from '../types';
import { buildClassSlots } from '../utils/classes';
import { toLocalDateKey } from '../utils/dates';

const hoje = toLocalDateKey(new Date());

const turma: ServiceItem = {
  id: 'serv-nat', name: 'Natação em turma', description: '', price: 120, durationMinutes: 60,
  active: true, modality: 'Presencial', iconName: 'pool', capacity: 3,
};

const students: Student[] = [
  { id: 'std-1', name: 'Ana Souza', email: '', phone: '', avatar: '', joinedDate: '', totalClasses: 0, status: 'Ativo', level: 'iniciante' },
];

function aula(over: Partial<Appointment> = {}): Appointment {
  return {
    id: `apt-${Math.random().toString(36).slice(2)}`,
    studentName: 'Aluno', serviceId: 'serv-nat', serviceName: 'Natação em turma',
    date: hoje, dayOfWeek: 1, startTime: '09:00', endTime: '10:00', durationMinutes: 60,
    modality: 'Presencial', status: 'Confirmado', price: 120, ...over,
  };
}

describe('lista de chamada', () => {
  it('lista os alunos da turma com o nível de cada um', () => {
    const agenda = [aula({ studentId: 'std-1', studentName: 'Ana Souza' }), aula({ studentName: 'Bruno Lima' })];
    const slot = buildClassSlots(agenda, [turma])[0];
    render(<AttendanceModal slot={slot} students={students} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText(/iniciante/i)).toBeInTheDocument();
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument();
    expect(screen.getByText(/nível não definido/i)).toBeInTheDocument();
    expect(screen.getByText(/2 de 3 vagas/i)).toBeInTheDocument();
  });

  it('marca presença aluno por aluno e devolve as marcações', () => {
    const onSave = vi.fn();
    const agenda = [aula({ id: 'apt-ana', studentName: 'Ana Souza' }), aula({ id: 'apt-bruno', studentName: 'Bruno Lima' })];
    const slot = buildClassSlots(agenda, [turma])[0];
    render(<AttendanceModal slot={slot} students={students} onClose={vi.fn()} onSave={onSave} />);

    const linhaAna = screen.getByText('Ana Souza').closest('div')!.parentElement!.parentElement as HTMLElement;
    fireEvent.click(within(linhaAna).getByRole('button', { name: /^presente$/i }));

    const linhaBruno = screen.getByText('Bruno Lima').closest('div')!.parentElement!.parentElement as HTMLElement;
    fireEvent.click(within(linhaBruno).getByRole('button', { name: /^falta$/i }));

    fireEvent.click(screen.getByRole('button', { name: /salvar chamada/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toEqual([
      { appointmentId: 'apt-ana', attendance: 'presente', attendanceNote: undefined },
      { appointmentId: 'apt-bruno', attendance: 'falta', attendanceNote: undefined },
    ]);
  });

  it('"marcar todos" preenche a turma inteira de uma vez', () => {
    const onSave = vi.fn();
    const agenda = [aula({ id: 'a1', studentName: 'Ana' }), aula({ id: 'a2', studentName: 'Bruno' })];
    const slot = buildClassSlots(agenda, [turma])[0];
    render(<AttendanceModal slot={slot} students={[]} onClose={vi.fn()} onSave={onSave} />);

    const barra = screen.getByText(/marcar todos/i).parentElement as HTMLElement;
    fireEvent.click(within(barra).getByRole('button', { name: /^presente$/i }));
    fireEvent.click(screen.getByRole('button', { name: /salvar chamada/i }));

    expect(onSave.mock.calls[0][0].every((m: { attendance?: string }) => m.attendance === 'presente')).toBe(true);
  });

  it('falta justificada pede o motivo e grava junto', () => {
    const onSave = vi.fn();
    const slot = buildClassSlots([aula({ id: 'a1', studentName: 'Ana' })], [turma])[0];
    render(<AttendanceModal slot={slot} students={[]} onClose={vi.fn()} onSave={onSave} />);

    // a barra 'marcar todos' tem os mesmos rótulos: pega o botão da linha da Ana
    const linhaAna = screen.getByText('Ana').closest('div')!.parentElement!.parentElement as HTMLElement;
    fireEvent.click(within(linhaAna).getByRole('button', { name: /falta justificada/i }));
    fireEvent.change(screen.getByLabelText(/motivo da falta de ana/i), { target: { value: 'Atestado médico' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar chamada/i }));

    expect(onSave.mock.calls[0][0][0]).toEqual({
      appointmentId: 'a1',
      attendance: 'justificada',
      attendanceNote: 'Atestado médico',
    });
  });

  it('clicar de novo no mesmo status desmarca', () => {
    const onSave = vi.fn();
    const slot = buildClassSlots([aula({ id: 'a1', studentName: 'Ana', attendance: 'presente' })], [turma])[0];
    render(<AttendanceModal slot={slot} students={[]} onClose={vi.fn()} onSave={onSave} />);

    fireEvent.click(screen.getAllByRole('button', { name: /^presente$/i })[1]);
    fireEvent.click(screen.getByRole('button', { name: /salvar chamada/i }));
    expect(onSave.mock.calls[0][0][0].attendance).toBeUndefined();
  });
});

describe('painel de turmas e lista de espera', () => {
  function renderPanel(agenda: Appointment[], fila: WaitlistEntry[] = []) {
    const onOpenAttendance = vi.fn();
    const onPromoteWaitlistEntry = vi.fn();
    const onRemoveWaitlistEntry = vi.fn();
    render(
      <ClassesAndWaitlistPanel
        appointments={agenda}
        services={[turma]}
        waitlist={fila}
        onOpenAttendance={onOpenAttendance}
        onPromoteWaitlistEntry={onPromoteWaitlistEntry}
        onRemoveWaitlistEntry={onRemoveWaitlistEntry}
      />
    );
    return { onOpenAttendance, onPromoteWaitlistEntry, onRemoveWaitlistEntry };
  }

  const espera = (over: Partial<WaitlistEntry> = {}): WaitlistEntry => ({
    id: 'w1', serviceId: 'serv-nat', serviceName: 'Natação em turma', date: hoje, startTime: '09:00',
    studentName: 'Carla Dias', status: 'aguardando', createdAt: '2026-09-01T10:00:00.000Z', ...over,
  });

  it('mostra as turmas do dia com a ocupação e abre a chamada', () => {
    const agenda = [aula({ studentName: 'Ana' }), aula({ studentName: 'Bruno' })];
    const { onOpenAttendance } = renderPanel(agenda);

    expect(screen.getByText(/2 de 3 vagas/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /fazer chamada/i }));
    expect(onOpenAttendance).toHaveBeenCalledTimes(1);
    expect(onOpenAttendance.mock.calls[0][0].roster).toHaveLength(2);
  });

  it('turma já chamada mostra o resultado em vez de pedir a chamada de novo', () => {
    renderPanel([aula({ studentName: 'Ana', attendance: 'presente' })]);
    expect(screen.getByRole('button', { name: /ver chamada/i })).toBeInTheDocument();
    expect(screen.getByText(/1 presente/i)).toBeInTheDocument();
  });

  it('turma lotada não gera alerta de vaga, só a fila', () => {
    const cheia = [aula({ studentName: 'A' }), aula({ studentName: 'B' }), aula({ studentName: 'C' })];
    renderPanel(cheia, [espera()]);
    expect(screen.queryByText(/abriu vaga/i)).not.toBeInTheDocument();
    expect(screen.getByText('Carla Dias')).toBeInTheDocument();
  });

  it('vaga aberta gera o alerta e o botão de chamar o primeiro da fila', () => {
    const { onPromoteWaitlistEntry } = renderPanel([aula({ studentName: 'Ana' })], [espera()]);
    expect(screen.getByText(/abriu vaga/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^chamar$/i }));
    expect(onPromoteWaitlistEntry).toHaveBeenCalledWith(expect.objectContaining({ studentName: 'Carla Dias' }));
  });

  it('dá para tirar alguém da fila', () => {
    const { onRemoveWaitlistEntry } = renderPanel([], [espera()]);
    fireEvent.click(screen.getByRole('button', { name: /remover carla dias da lista de espera/i }));
    expect(onRemoveWaitlistEntry).toHaveBeenCalledWith('w1');
  });

  it('fila vazia explica para que serve o painel', () => {
    renderPanel([]);
    expect(screen.getByText(/ninguém na lista de espera/i)).toBeInTheDocument();
  });
});
