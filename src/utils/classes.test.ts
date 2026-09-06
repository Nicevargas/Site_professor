import { describe, it, expect } from 'vitest';
import { Appointment, ServiceItem } from '../types';
import {
  availability,
  buildClassSlots,
  countEnrolled,
  isAlreadyEnrolled,
  serviceCapacity,
  slotCapacity,
  slotKeyOf,
  summarizeAttendance,
} from './classes';

const turma: ServiceItem = {
  id: 'serv-nat',
  name: 'Natação em turma',
  description: '',
  price: 120,
  durationMinutes: 45,
  active: true,
  modality: 'Presencial',
  iconName: 'pool',
  capacity: 4,
};

const individual: ServiceItem = { ...turma, id: 'serv-pt', name: 'Personal 1h', capacity: 1 };

function aula(over: Partial<Appointment> = {}): Appointment {
  return {
    id: `apt-${Math.random().toString(36).slice(2)}`,
    studentName: 'Aluno',
    serviceId: 'serv-nat',
    serviceName: 'Natação em turma',
    date: '2026-09-10',
    dayOfWeek: 4,
    startTime: '09:00',
    endTime: '09:45',
    durationMinutes: 45,
    modality: 'Presencial',
    status: 'Confirmado',
    price: 120,
    ...over,
  };
}

describe('capacidade da turma', () => {
  it('sem capacidade definida, o serviço é aula individual', () => {
    expect(serviceCapacity(undefined)).toBe(1);
    expect(serviceCapacity({ capacity: undefined })).toBe(1);
    expect(serviceCapacity({ capacity: 0 })).toBe(1);
    expect(serviceCapacity({ capacity: 2.7 })).toBe(2);
    expect(serviceCapacity({ capacity: 6 })).toBe(6);
  });

  it('o limite gravado no horário vence o limite do serviço', () => {
    expect(slotCapacity([], turma)).toBe(4);
    expect(slotCapacity([aula({ capacity: 2 })], turma)).toBe(2);
  });

  it('conta só quem ocupa vaga: cancelada e bloqueio não contam', () => {
    const agenda = [
      aula({ studentName: 'Ana' }),
      aula({ studentName: 'Bruno' }),
      aula({ studentName: 'Carla', status: 'Cancelado' }),
      aula({ studentName: '', status: 'Bloqueado' }),
    ];
    expect(countEnrolled(agenda, { serviceId: 'serv-nat', date: '2026-09-10', startTime: '09:00' })).toBe(2);
  });

  it('vagas restantes e lotação seguem o limite do serviço', () => {
    const agenda = [aula({ studentName: 'Ana' }), aula({ studentName: 'Bruno' })];
    const livre = availability(agenda, { serviceId: 'serv-nat', date: '2026-09-10', startTime: '09:00' }, turma);
    expect(livre).toMatchObject({ capacity: 4, enrolled: 2, spotsLeft: 2, isFull: false });

    const lotado = availability(agenda, { serviceId: 'serv-pt', date: '2026-09-10', startTime: '09:00' }, individual);
    // outro serviço no mesmo horário é outro slot: aqui não há ninguém
    expect(lotado).toMatchObject({ enrolled: 0, isFull: false });
  });

  it('aula individual lota com um aluno só', () => {
    const agenda = [aula({ serviceId: 'serv-pt', studentName: 'Ana' })];
    const state = availability(agenda, { serviceId: 'serv-pt', date: '2026-09-10', startTime: '09:00' }, individual);
    expect(state).toMatchObject({ capacity: 1, enrolled: 1, spotsLeft: 0, isFull: true });
  });

  it('remarcar a própria aula não conta contra ela mesma', () => {
    const minha = aula({ id: 'apt-minha', serviceId: 'serv-pt' });
    const state = availability([minha], minha, individual, { ignoreAppointmentId: 'apt-minha' });
    expect(state.isFull).toBe(false);
  });

  it('reconhece quem já está matriculado, por id ou por nome', () => {
    const agenda = [aula({ studentId: 'std-1', studentName: 'Ana Souza' })];
    const slot = { serviceId: 'serv-nat', date: '2026-09-10', startTime: '09:00' };
    expect(isAlreadyEnrolled(agenda, slot, { studentId: 'std-1' })).toBe(true);
    expect(isAlreadyEnrolled(agenda, slot, { studentName: 'ana souza' })).toBe(true);
    expect(isAlreadyEnrolled(agenda, slot, { studentName: 'Bruno' })).toBe(false);
  });

  it('a chave do slot separa serviço, dia e horário', () => {
    expect(slotKeyOf({ serviceId: 'a', date: '2026-01-01', startTime: '08:00' })).toBe('a|2026-01-01|08:00');
    expect(slotKeyOf({ date: '2026-01-01', startTime: '08:00' })).toContain('sem-servico');
  });
});

describe('turmas e chamada', () => {
  it('agrupa as aulas do mesmo horário numa turma só', () => {
    const agenda = [
      aula({ studentName: 'Ana' }),
      aula({ studentName: 'Bruno' }),
      aula({ studentName: 'Carla', startTime: '10:00', endTime: '10:45' }),
      aula({ status: 'Bloqueado', studentName: 'bloqueio' }),
    ];
    const slots = buildClassSlots(agenda, [turma]);
    expect(slots).toHaveLength(2);
    expect(slots[0].startTime).toBe('09:00');
    expect(slots[0].roster.map((r) => r.studentName)).toEqual(['Ana', 'Bruno']);
    expect(slots[0]).toMatchObject({ capacity: 4, enrolled: 2, spotsLeft: 2, isFull: false });
    expect(slots[1].enrolled).toBe(1);
  });

  it('resume a chamada e mostra quem ainda não foi marcado', () => {
    const roster = [
      aula({ attendance: 'presente' }),
      aula({ attendance: 'presente' }),
      aula({ attendance: 'falta' }),
      aula({ attendance: 'justificada' }),
      aula({}),
    ];
    expect(summarizeAttendance(roster)).toEqual({
      total: 5,
      presente: 2,
      falta: 1,
      justificada: 1,
      pendente: 1,
    });
  });
});
