import { DiaDaSemana, GradeSemanal } from '../types';
import { addDays, rotuloCurtoDoDia, toLocalDateKey } from './dates';

/**
 * Horários de aula por dia da semana.
 *
 * O agendamento do site oferecia os mesmos cinco horários (09:00 a 17:00, de
 * segunda a sexta) para todo professor, escritos no código. Agora cada um
 * define os seus -- e, para não cadastrar dia por dia, pode copiar os
 * horários de um dia para os outros.
 *
 * Quem ainda não configurou continua com aquela grade antiga (GRADE_PADRAO):
 * a vitrine de ninguém muda sozinha. Grade salva vazia é diferente de grade
 * nunca configurada: significa "não abro horário pelo site", e é respeitada.
 */

export const DIAS: { dia: DiaDaSemana; nome: string }[] = [
  { dia: 1, nome: 'Segunda' },
  { dia: 2, nome: 'Terça' },
  { dia: 3, nome: 'Quarta' },
  { dia: 4, nome: 'Quinta' },
  { dia: 5, nome: 'Sexta' },
  { dia: 6, nome: 'Sábado' },
  { dia: 0, nome: 'Domingo' },
];

const HORARIOS_PADRAO = ['09:00', '10:30', '14:00', '15:30', '17:00'];

/** A grade que o site usava para todos, antes de existir esta configuração. */
export const GRADE_PADRAO: GradeSemanal = {
  1: [...HORARIOS_PADRAO],
  2: [...HORARIOS_PADRAO],
  3: [...HORARIOS_PADRAO],
  4: [...HORARIOS_PADRAO],
  5: [...HORARIOS_PADRAO],
};

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export function horarioValido(hora: unknown): hora is string {
  return typeof hora === 'string' && HORA.test(hora);
}

export function nomeDoDia(dia: number): string {
  return DIAS.find((d) => d.dia === dia)?.nome || '';
}

/** "Terça, Quinta e Sábado", sempre na ordem da semana. */
export function listaDeDias(dias: number[]): string {
  const nomes = DIAS.filter((d) => dias.includes(d.dia)).map((d) => d.nome);
  if (nomes.length <= 1) return nomes.join('');
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

/**
 * Grade limpa: só dias de 0 a 6, só horários válidos, sem repetição e em
 * ordem. Vale para o que vem do banco (chaves em texto) e para o que a tela
 * monta. Dia sem horário some da grade.
 */
export function normalizarGrade(grade: unknown): GradeSemanal {
  const limpa: GradeSemanal = {};
  if (!grade || typeof grade !== 'object' || Array.isArray(grade)) return limpa;
  const fonte = grade as Record<string, unknown>;
  for (let dia = 0; dia <= 6; dia++) {
    const lista = fonte[String(dia)];
    if (!Array.isArray(lista)) continue;
    const horas = [...new Set(lista.filter(horarioValido))].sort();
    if (horas.length) limpa[dia as DiaDaSemana] = horas;
  }
  return limpa;
}

/** A grade que vale: a do professor, ou a padrão se ele nunca configurou. */
export function gradeEfetiva(grade?: GradeSemanal | null): GradeSemanal {
  return normalizarGrade(grade == null ? GRADE_PADRAO : grade);
}

export function horariosDoDia(grade: GradeSemanal, dia: number): string[] {
  return [...(grade[dia as DiaDaSemana] || [])];
}

export function adicionarHorario(grade: GradeSemanal, dia: number, hora: string): GradeSemanal {
  if (!horarioValido(hora)) return normalizarGrade(grade);
  return normalizarGrade({ ...grade, [dia]: [...horariosDoDia(grade, dia), hora] });
}

export function removerHorario(grade: GradeSemanal, dia: number, hora: string): GradeSemanal {
  return normalizarGrade({ ...grade, [dia]: horariosDoDia(grade, dia).filter((h) => h !== hora) });
}

/** Os dias marcados passam a ter exatamente os horários do dia de origem. */
export function copiarHorarios(grade: GradeSemanal, origem: number, destinos: number[]): GradeSemanal {
  const horas = horariosDoDia(grade, origem);
  const nova: Record<number, string[] | undefined> = { ...grade };
  destinos
    .filter((d) => d !== origem)
    .forEach((d) => {
      nova[d] = [...horas];
    });
  return normalizarGrade(nova);
}

/** Dias marcados que já têm horários diferentes -- e vão perdê-los na cópia. */
export function diasQueSeraoSubstituidos(grade: GradeSemanal, origem: number, destinos: number[]): number[] {
  const horas = horariosDoDia(grade, origem).join('|');
  return destinos.filter((d) => {
    if (d === origem) return false;
    const atuais = horariosDoDia(grade, d);
    return atuais.length > 0 && atuais.join('|') !== horas;
  });
}

export function mesmaGrade(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizarGrade(a)) === JSON.stringify(normalizarGrade(b));
}

export function periodoDoHorario(hora: string): 'Manhã' | 'Tarde' | 'Noite' {
  const h = Number(hora.slice(0, 2));
  if (h < 12) return 'Manhã';
  if (h < 18) return 'Tarde';
  return 'Noite';
}

/**
 * Próximos dias, a partir de amanhã, que têm aula na grade.
 * Olha até `janela` dias à frente: grade vazia não vira laço sem fim.
 */
export function proximosDiasComAula(
  grade: GradeSemanal,
  quantidade: number,
  de: Date = new Date(),
  janela = 28
): { date: string; label: string; dayOfWeek: number }[] {
  const dias: { date: string; label: string; dayOfWeek: number }[] = [];
  for (let i = 1; i <= janela && dias.length < quantidade; i++) {
    const d = addDays(de, i);
    if (horariosDoDia(grade, d.getDay()).length === 0) continue;
    dias.push({ date: toLocalDateKey(d), label: rotuloCurtoDoDia(d), dayOfWeek: d.getDay() });
  }
  return dias;
}
