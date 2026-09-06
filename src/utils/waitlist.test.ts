import { describe, it, expect } from 'vitest';
import { Appointment, ServiceItem, WaitlistEntry } from '../types';
import { alreadyWaiting, openSpotAlerts, positionInQueue, queueForSlot } from './waitlist';

const turma: ServiceItem = {
  id: 'serv-nat',
  name: 'Natação em turma',
  description: '',
  price: 120,
  durationMinutes: 60,
  active: true,
  modality: 'Presencial',
  iconName: 'pool',
  capacity: 2,
};

function aula(over: Partial<Appointment> = {}): Appointment {
  return {
    id: `apt-${Math.random().toString(36).slice(2)}`,
    studentName: 'Aluno',
    serviceId: 'serv-nat',
    serviceName: 'Natação em turma',
    date: '2026-09-10',
    dayOfWeek: 4,
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: 60,
    modality: 'Presencial',
    status: 'Confirmado',
    price: 120,
    ...over,
  };
}

function espera(over: Partial<WaitlistEntry> = {}): WaitlistEntry {
  return {
    id: `wait-${Math.random().toString(36).slice(2)}`,
    serviceId: 'serv-nat',
    serviceName: 'Natação em turma',
    date: '2026-09-10',
    startTime: '09:00',
    studentName: 'Interessado',
    status: 'aguardando',
    createdAt: '2026-09-01T10:00:00.000Z',
    ...over,
  };
}

describe('fila de espera', () => {
  it('ordena por chegada e ignora quem saiu da fila', () => {
    const fila = [
      espera({ id: 'w2', studentName: 'Bruno', createdAt: '2026-09-02T10:00:00.000Z' }),
      espera({ id: 'w1', studentName: 'Ana', createdAt: '2026-09-01T10:00:00.000Z' }),
      espera({ id: 'w3', studentName: 'Carla', status: 'removido', createdAt: '2026-09-03T10:00:00.000Z' }),
      espera({ id: 'w4', studentName: 'Davi', status: 'matriculado', createdAt: '2026-09-04T10:00:00.000Z' }),
    ];
    const ordenada = queueForSlot(fila, { serviceId: 'serv-nat', date: '2026-09-10', startTime: '09:00' });
    expect(ordenada.map((e) => e.studentName)).toEqual(['Ana', 'Bruno']);
    expect(positionInQueue(fila, 'w1')).toBe(1);
    expect(positionInQueue(fila, 'w2')).toBe(2);
    expect(positionInQueue(fila, 'w3')).toBe(0);
  });

  it('cada horário tem a sua própria fila', () => {
    const fila = [
      espera({ studentName: 'Ana' }),
      espera({ studentName: 'Bruno', startTime: '10:00' }),
    ];
    expect(queueForSlot(fila, { serviceId: 'serv-nat', date: '2026-09-10', startTime: '10:00' })).toHaveLength(1);
  });

  it('não deixa a mesma pessoa entrar duas vezes na fila do mesmo horário', () => {
    const fila = [espera({ studentId: 'std-1', studentName: 'Ana Souza', studentEmail: 'ana@email.com' })];
    const slot = { serviceId: 'serv-nat', date: '2026-09-10', startTime: '09:00' };
    expect(alreadyWaiting(fila, slot, { studentId: 'std-1' })).toBe(true);
    expect(alreadyWaiting(fila, slot, { studentEmail: 'ANA@email.com' })).toBe(true);
    expect(alreadyWaiting(fila, slot, { studentName: 'ana souza' })).toBe(true);
    expect(alreadyWaiting(fila, slot, { studentName: 'Bruno' })).toBe(false);
  });

  it('turma cheia não gera alerta de vaga', () => {
    const agenda = [aula({ studentName: 'Ana' }), aula({ studentName: 'Bruno' })];
    expect(openSpotAlerts([espera()], agenda, [turma])).toHaveLength(0);
  });

  it('cancelamento abre vaga e o alerta chama o primeiro da fila', () => {
    const agenda = [aula({ studentName: 'Ana' }), aula({ studentName: 'Bruno', status: 'Cancelado' })];
    const fila = [
      espera({ id: 'w2', studentName: 'Davi', createdAt: '2026-09-02T10:00:00.000Z' }),
      espera({ id: 'w1', studentName: 'Carla', createdAt: '2026-09-01T10:00:00.000Z' }),
    ];
    const alertas = openSpotAlerts(fila, agenda, [turma]);
    expect(alertas).toHaveLength(1);
    expect(alertas[0].entry.studentName).toBe('Carla');
    expect(alertas[0]).toMatchObject({ spotsLeft: 1, capacity: 2, waitingCount: 2 });
  });

  it('não oferece dois alunos para a mesma vaga', () => {
    const fila = [
      espera({ id: 'w1', studentName: 'Carla', createdAt: '2026-09-01T10:00:00.000Z' }),
      espera({ id: 'w2', studentName: 'Davi', createdAt: '2026-09-02T10:00:00.000Z' }),
    ];
    const alertas = openSpotAlerts(fila, [], [turma]);
    expect(alertas).toHaveLength(1);
    expect(alertas[0].entry.id).toBe('w1');
  });
});
