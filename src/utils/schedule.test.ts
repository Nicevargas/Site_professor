import { describe, it, expect } from 'vitest';
import { Appointment, ServiceItem } from '../types';
import { addMinutes, checkBooking, findConflict, toMinutes } from './schedule';

const turma: ServiceItem = {
  id: 'serv-nat',
  name: 'Natação em turma',
  description: '',
  price: 120,
  durationMinutes: 60,
  active: true,
  modality: 'Presencial',
  iconName: 'pool',
  capacity: 3,
};

const individual: ServiceItem = { ...turma, id: 'serv-pt', capacity: 1 };

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

const candidato = (over: Partial<Parameters<typeof checkBooking>[0]> = {}) => ({
  serviceId: 'serv-nat',
  date: '2026-09-10',
  startTime: '09:00',
  endTime: '10:00',
  studentName: 'Novo Aluno',
  ...over,
});

describe('horas', () => {
  it('converte e soma horários', () => {
    expect(toMinutes('09:30')).toBe(570);
    expect(addMinutes('09:30', 45)).toBe('10:15');
    expect(addMinutes('23:30', 60)).toBe('00:30');
  });
});

describe('findConflict segue valendo para sobreposição pura', () => {
  it('acha o compromisso que se sobrepõe e ignora cancelados', () => {
    const agenda = [aula({ id: 'a1' }), aula({ id: 'a2', startTime: '11:00', endTime: '12:00', status: 'Cancelado' })];
    expect(findConflict({ date: '2026-09-10', startTime: '09:30', endTime: '10:30' }, agenda)?.id).toBe('a1');
    expect(findConflict({ date: '2026-09-10', startTime: '11:00', endTime: '12:00' }, agenda)).toBeNull();
  });
});

describe('checkBooking: turma, lotação e fila', () => {
  it('horário livre passa', () => {
    expect(checkBooking(candidato(), [], turma).ok).toBe(true);
  });

  it('bloqueio sempre impede, mesmo com vaga na turma', () => {
    const agenda = [aula({ status: 'Bloqueado', studentName: 'Bloqueado' })];
    const r = checkBooking(candidato(), agenda, turma);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('bloqueado');
  });

  it('outra aula em cima do horário é choque, não vaga de turma', () => {
    const agenda = [aula({ serviceId: 'serv-pt', serviceName: 'Personal', studentName: 'Ana', startTime: '09:30', endTime: '10:30' })];
    const r = checkBooking(candidato(), agenda, turma);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('choque');
    expect(r.message).toContain('Ana');
  });

  it('entrar numa turma que ainda tem vaga é permitido', () => {
    const agenda = [aula({ studentName: 'Ana' }), aula({ studentName: 'Bruno' })];
    const r = checkBooking(candidato(), agenda, turma);
    expect(r.ok).toBe(true);
    expect(r.availability).toMatchObject({ capacity: 3, enrolled: 2, spotsLeft: 1 });
  });

  it('turma cheia devolve "lotado" — é o gancho da lista de espera', () => {
    const agenda = [aula({ studentName: 'Ana' }), aula({ studentName: 'Bruno' }), aula({ studentName: 'Carla' })];
    const r = checkBooking(candidato(), agenda, turma);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('lotado');
    expect(r.message).toContain('lista de espera');
  });

  it('o mesmo aluno não entra duas vezes na mesma turma', () => {
    const agenda = [aula({ studentName: 'Ana Souza' })];
    const r = checkBooking(candidato({ studentName: 'ana souza' }), agenda, turma);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('duplicado');
  });

  it('aula individual continua bloqueando com um aluno só', () => {
    const agenda = [aula({ serviceId: 'serv-pt', studentName: 'Ana' })];
    const r = checkBooking(candidato({ serviceId: 'serv-pt' }), agenda, individual);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('lotado');
  });

  it('cancelada libera a vaga da turma', () => {
    const agenda = [
      aula({ studentName: 'Ana' }),
      aula({ studentName: 'Bruno' }),
      aula({ studentName: 'Carla', status: 'Cancelado' }),
    ];
    expect(checkBooking(candidato(), agenda, turma).ok).toBe(true);
  });

  it('reagendar a própria aula para o mesmo horário não acusa lotação', () => {
    const minha = aula({ id: 'apt-minha', serviceId: 'serv-pt', studentName: 'Ana' });
    const r = checkBooking(candidato({ id: 'apt-minha', serviceId: 'serv-pt', studentName: 'Ana' }), [minha], individual);
    expect(r.ok).toBe(true);
  });
});
