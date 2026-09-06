import { describe, it, expect } from 'vitest';
import { Appointment, PaymentInvoice, ServiceItem, Student, TeacherProfile } from '../types';
import { computeCompanyStats, formatPercent, weekKeys } from './companyStats';
import { toLocalDateKey, startOfWeek, addDays } from './dates';

const HOJE = new Date('2026-09-09T12:00:00'); // uma quarta-feira
const hojeKey = toLocalDateKey(HOJE);
const semana = weekKeys(HOJE);
const foraDaSemana = toLocalDateKey(addDays(startOfWeek(HOJE), 20));

function prof(id: string, name: string, companyId = 'comp-1'): TeacherProfile {
  return {
    id, name, companyId, role: 'Instrutor', specialty: '', bio: '',
    rating: 5, reviewCount: 1, yearsExperience: 1,
    avatarUrl: '', heroImageUrl: '', whatsapp: '', email: `${id}@x.com`,
  };
}

const ana = prof('prof-ana', 'Ana');
const bruno = prof('prof-bruno', 'Bruno');

const turma: ServiceItem = {
  id: 'serv-turma', name: 'Natação em turma', description: '', price: 100,
  durationMinutes: 60, active: true, modality: 'Presencial', iconName: 'pool', capacity: 4,
};

function aula(over: Partial<Appointment>): Appointment {
  return {
    id: `apt-${Math.random().toString(36).slice(2)}`,
    teacherId: 'prof-ana', studentName: 'Aluno', serviceId: 'serv-turma',
    serviceName: 'Natação em turma', date: hojeKey, dayOfWeek: 3,
    startTime: '09:00', endTime: '10:00', durationMinutes: 60,
    modality: 'Presencial', status: 'Confirmado', price: 100, ...over,
  };
}

function aluno(over: Partial<Student>): Student {
  return {
    id: `std-${Math.random().toString(36).slice(2)}`, teacherId: 'prof-ana',
    name: 'Aluno', email: '', phone: '', avatar: '', joinedDate: '',
    totalClasses: 0, status: 'Ativo', ...over,
  };
}

function cobranca(over: Partial<PaymentInvoice>): PaymentInvoice {
  return {
    id: `inv-${Math.random().toString(36).slice(2)}`, teacherId: 'prof-ana',
    studentName: 'Aluno', serviceOrPlanName: 'Mensalidade', amount: 200,
    dueDate: hojeKey, status: 'pendente', method: 'pix', createdAt: hojeKey, ...over,
  };
}

const calcular = (
  appointments: Appointment[] = [],
  students: Student[] = [],
  invoices: PaymentInvoice[] = [],
  includeFinance = false
) =>
  computeCompanyStats([ana, bruno], appointments, students, invoices, [turma], {
    includeFinance,
    today: HOJE,
  });

describe('semana de referência', () => {
  it('cobre sete dias a partir do início da semana', () => {
    expect(semana).toHaveLength(7);
    expect(semana).toContain(hojeKey);
    expect(new Set(semana).size).toBe(7);
  });
});

describe('números da academia', () => {
  it('conta aulas de hoje e da semana, por professor', () => {
    const r = calcular([
      aula({ teacherId: 'prof-ana' }),
      aula({ teacherId: 'prof-ana', date: semana[5], startTime: '11:00' }),
      aula({ teacherId: 'prof-bruno' }),
      aula({ teacherId: 'prof-ana', date: foraDaSemana }),
    ]);

    const stAna = r.teachers.find((t) => t.teacher.id === 'prof-ana')!;
    expect(stAna.aulasHoje).toBe(1);
    expect(stAna.aulasSemana).toBe(2); // a de fora da semana não entra
    expect(r.totalAulasHoje).toBe(2);
    expect(r.totalAulasSemana).toBe(3);
  });

  it('aula cancelada e bloqueio não contam', () => {
    const r = calcular([
      aula({ status: 'Cancelado' }),
      aula({ status: 'Bloqueado', startTime: '11:00' }),
      aula({ startTime: '14:00' }),
    ]);
    expect(r.totalAulasHoje).toBe(1);
  });

  it('só conta aluno ativo, e do professor certo', () => {
    const r = calcular([], [
      aluno({ teacherId: 'prof-ana' }),
      aluno({ teacherId: 'prof-ana', status: 'Inativo' }),
      aluno({ teacherId: 'prof-bruno' }),
      aluno({ teacherId: 'prof-de-outra-academia' }),
    ]);
    expect(r.teachers.find((t) => t.teacher.id === 'prof-ana')!.alunosAtivos).toBe(1);
    expect(r.totalAlunos).toBe(2);
  });

  it('ocupação é vaga preenchida sobre vaga oferecida', () => {
    // Uma turma de 4 com 2 matriculados = 50%
    const r = calcular([
      aula({ studentName: 'A' }),
      aula({ studentName: 'B' }),
    ]);
    const stAna = r.teachers.find((t) => t.teacher.id === 'prof-ana')!;
    expect(stAna.vagasOferecidas).toBe(4);
    expect(stAna.vagasOcupadas).toBe(2);
    expect(stAna.ocupacao).toBeCloseTo(0.5);
    expect(formatPercent(stAna.ocupacao)).toBe('50%');
  });

  it('sem turma na semana, ocupação é indefinida e não vira zero', () => {
    const r = calcular([]);
    expect(r.ocupacaoGeral).toBeNull();
    expect(formatPercent(null)).toBe('—');
  });

  it('conta as faltas marcadas na chamada', () => {
    const r = calcular([
      aula({ attendance: 'falta' }),
      aula({ attendance: 'presente', startTime: '11:00' }),
      aula({ attendance: 'justificada', startTime: '14:00' }),
    ]);
    expect(r.teachers.find((t) => t.teacher.id === 'prof-ana')!.faltasSemana).toBe(1);
  });
});

describe('financeiro: só quando a empresa libera', () => {
  const cobrancas = [
    cobranca({ amount: 200, status: 'pendente' }),
    cobranca({ amount: 150, status: 'vencido' }),
    cobranca({ amount: 300, status: 'pago', paidAt: hojeKey }),
    cobranca({ amount: 999, status: 'pago', paidAt: '2026-01-05' }), // outro mês
  ];

  it('fechado: os campos vêm nulos, não zerados', () => {
    const r = calcular([], [], cobrancas, false);
    const stAna = r.teachers.find((t) => t.teacher.id === 'prof-ana')!;
    expect(stAna.aReceber).toBeNull();
    expect(stAna.recebidoNoMes).toBeNull();
    expect(r.totalAReceber).toBeNull();
    // Nulo e zero são coisas diferentes: zero diria "não há nada a receber"
    expect(stAna.aReceber).not.toBe(0);
  });

  it('aberto: soma pendente e vencido, e o recebido só do mês corrente', () => {
    const r = calcular([], [], cobrancas, true);
    const stAna = r.teachers.find((t) => t.teacher.id === 'prof-ana')!;
    expect(stAna.aReceber).toBe(350);
    expect(stAna.recebidoNoMes).toBe(300);
    expect(stAna.cobrancasVencidas).toBe(1);
    expect(r.totalAReceber).toBe(350);
  });
});

describe('ordenação', () => {
  it('quem tem mais aula na semana aparece primeiro', () => {
    const r = calcular([
      aula({ teacherId: 'prof-bruno' }),
      aula({ teacherId: 'prof-bruno', startTime: '11:00' }),
      aula({ teacherId: 'prof-ana', startTime: '14:00' }),
    ]);
    expect(r.teachers[0].teacher.id).toBe('prof-bruno');
  });
});
