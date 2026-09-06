import { Appointment, PaymentInvoice, Student, TeacherProfile } from '../types';
import { addDays, startOfWeek, toLocalDateKey } from './dates';
import { buildClassSlots } from './classes';
import { ServiceItem } from '../types';

/**
 * Números da academia, professor a professor.
 * O gestor abre isto antes de qualquer outra tela: é o resumo que responde
 * "como foi a semana" sem precisar entrar na agenda de cada professor.
 */

export interface TeacherStats {
  teacher: TeacherProfile;
  aulasHoje: number;
  aulasSemana: number;
  alunosAtivos: number;
  /** Vagas ocupadas / vagas oferecidas nas turmas da semana */
  vagasOcupadas: number;
  vagasOferecidas: number;
  ocupacao: number | null; // 0..1, null quando não há turma na semana
  faltasSemana: number;
  /** Só preenchido quando a empresa libera o financeiro ao gestor */
  aReceber: number | null;
  recebidoNoMes: number | null;
  cobrancasVencidas: number | null;
}

export interface CompanyStats {
  teachers: TeacherStats[];
  totalAulasHoje: number;
  totalAulasSemana: number;
  totalAlunos: number;
  ocupacaoGeral: number | null;
  totalAReceber: number | null;
  totalRecebidoNoMes: number | null;
  totalVencidas: number | null;
}

const ativa = (a: Appointment) => a.status !== 'Cancelado' && a.status !== 'Bloqueado';

/** Datas da semana corrente, como chaves YYYY-MM-DD. */
export function weekKeys(reference: Date = new Date()): string[] {
  const inicio = startOfWeek(reference);
  return Array.from({ length: 7 }, (_, i) => toLocalDateKey(addDays(inicio, i)));
}

export function computeCompanyStats(
  teachers: TeacherProfile[],
  appointments: Appointment[],
  students: Student[],
  invoices: PaymentInvoice[],
  services: ServiceItem[],
  options: { includeFinance?: boolean; today?: Date } = {}
): CompanyStats {
  const hoje = options.today || new Date();
  const hojeKey = toLocalDateKey(hoje);
  const semana = new Set(weekKeys(hoje));
  const mesAtual = hojeKey.slice(0, 7); // YYYY-MM
  const finance = Boolean(options.includeFinance);

  const stats: TeacherStats[] = teachers.map((teacher) => {
    const doProfessor = appointments.filter((a) => a.teacherId === teacher.id);
    const naSemana = doProfessor.filter((a) => ativa(a) && semana.has(a.date));

    // Ocupação: quantas vagas das turmas da semana foram preenchidas
    const slots = buildClassSlots(naSemana, services);
    const vagasOferecidas = slots.reduce((soma, s) => soma + s.capacity, 0);
    const vagasOcupadas = slots.reduce((soma, s) => soma + s.enrolled, 0);

    const cobrancas = invoices.filter((inv) => inv.teacherId === teacher.id);

    return {
      teacher,
      aulasHoje: doProfessor.filter((a) => ativa(a) && a.date === hojeKey).length,
      aulasSemana: naSemana.length,
      alunosAtivos: students.filter((s) => s.teacherId === teacher.id && s.status === 'Ativo').length,
      vagasOcupadas,
      vagasOferecidas,
      ocupacao: vagasOferecidas > 0 ? vagasOcupadas / vagasOferecidas : null,
      faltasSemana: naSemana.filter((a) => a.attendance === 'falta').length,
      aReceber: finance
        ? cobrancas
            .filter((i) => i.status === 'pendente' || i.status === 'vencido')
            .reduce((soma, i) => soma + (Number(i.amount) || 0), 0)
        : null,
      recebidoNoMes: finance
        ? cobrancas
            .filter((i) => i.status === 'pago' && (i.paidAt || '').startsWith(mesAtual))
            .reduce((soma, i) => soma + (Number(i.amount) || 0), 0)
        : null,
      cobrancasVencidas: finance ? cobrancas.filter((i) => i.status === 'vencido').length : null,
    };
  });

  const soma = (pick: (t: TeacherStats) => number) => stats.reduce((acc, t) => acc + pick(t), 0);
  const somaFin = (pick: (t: TeacherStats) => number | null) =>
    finance ? stats.reduce((acc, t) => acc + (pick(t) || 0), 0) : null;

  const oferecidas = soma((t) => t.vagasOferecidas);

  return {
    teachers: stats.sort((a, b) => b.aulasSemana - a.aulasSemana),
    totalAulasHoje: soma((t) => t.aulasHoje),
    totalAulasSemana: soma((t) => t.aulasSemana),
    totalAlunos: soma((t) => t.alunosAtivos),
    ocupacaoGeral: oferecidas > 0 ? soma((t) => t.vagasOcupadas) / oferecidas : null,
    totalAReceber: somaFin((t) => t.aReceber),
    totalRecebidoNoMes: somaFin((t) => t.recebidoNoMes),
    totalVencidas: somaFin((t) => t.cobrancasVencidas),
  };
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatPercent(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}
