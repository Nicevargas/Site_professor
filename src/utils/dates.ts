/** Data local no formato YYYY-MM-DD (sem o deslocamento de fuso do toISOString). */
export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

const MONTHS_PT_BR = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** "Setembro 2026", formato usado no campo "cliente desde" do CRM. */
export function formatMonthYearPtBR(d: Date): string {
  return `${MONTHS_PT_BR[d.getMonth()]} ${d.getFullYear()}`;
}

const WEEKDAYS_PT_BR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export interface CalendarDay {
  /** YYYY-MM-DD */
  date: string;
  dayNumber: number;
  dayName: string;
  dayOfWeek: number;
  isToday: boolean;
  isWeekend: boolean;
  /** false para os dias que completam a grade do mês (mês anterior ou seguinte) */
  inMonth: boolean;
}

/** Converte 'YYYY-MM-DD' em Date local, sem o deslocamento de fuso do construtor com string. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Segunda-feira da semana que contém a data informada. */
export function startOfWeek(d: Date): Date {
  const result = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offsetToMonday = (result.getDay() + 6) % 7; // Dom=0 vira 6
  result.setDate(result.getDate() - offsetToMonday);
  return result;
}

function toCalendarDay(d: Date, today: string, inMonth = true): CalendarDay {
  const key = toLocalDateKey(d);
  return {
    date: key,
    dayNumber: d.getDate(),
    dayName: WEEKDAYS_PT_BR[d.getDay()],
    dayOfWeek: d.getDay(),
    isToday: key === today,
    isWeekend: d.getDay() === 0 || d.getDay() === 6,
    inMonth,
  };
}

/** Os sete dias da semana, de segunda a domingo, a partir de qualquer data dentro dela. */
export function buildWeek(anchor: Date, today: Date = new Date()): CalendarDay[] {
  const monday = startOfWeek(anchor);
  const todayKey = toLocalDateKey(today);
  return Array.from({ length: 7 }, (_, i) => toCalendarDay(addDays(monday, i), todayKey));
}

/** Grade do mês em semanas de domingo a sábado, completando com dias vizinhos. */
export function buildMonthGrid(anchor: Date, today: Date = new Date()): CalendarDay[] {
  const todayKey = toLocalDateKey(today);
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const start = addDays(first, -first.getDay()); // volta até o domingo
  const end = addDays(last, 6 - last.getDay()); // avança até o sábado
  const days: CalendarDay[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    days.push(toCalendarDay(d, todayKey, d.getMonth() === anchor.getMonth()));
  }
  return days;
}

/** "13 - 19 de Novembro" ou "29 Set - 5 Out" quando a semana cruza dois meses. */
export function formatWeekRange(week: CalendarDay[]): string {
  if (week.length === 0) return '';
  const first = parseDateKey(week[0].date);
  const last = parseDateKey(week[week.length - 1].date);
  const firstMonth = MONTHS_SHORT_PT_BR[first.getMonth()];
  const lastMonth = MONTHS_SHORT_PT_BR[last.getMonth()];
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} - ${last.getDate()} de ${MONTHS_PT_BR[first.getMonth()]}`;
  }
  return `${first.getDate()} ${firstMonth} - ${last.getDate()} ${lastMonth}`;
}
const MONTHS_SHORT_PT_BR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Próximos dias úteis a partir de amanhã, no formato usado pelo agendamento público.
 * Ex.: { date: '2026-09-07', label: 'Seg, 07 Set', dayOfWeek: 1 }
 */
export function nextBusinessDays(count: number, from: Date = new Date()): { date: string; label: string; dayOfWeek: number }[] {
  const days: { date: string; label: string; dayOfWeek: number }[] = [];
  const cursor = new Date(from);
  while (days.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    const dayOfWeek = cursor.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // pula fim de semana
    days.push({
      date: toLocalDateKey(cursor),
      label: `${WEEKDAYS_PT_BR[dayOfWeek]}, ${String(cursor.getDate()).padStart(2, '0')} ${MONTHS_SHORT_PT_BR[cursor.getMonth()]}`,
      dayOfWeek,
    });
  }
  return days;
}

/** Data relativa a hoje, usada nos dados de demonstração para a agenda parecer viva. */
export function relativeDate(daysFromToday: number): { date: string; dayOfWeek: number } {
  const d = addDays(new Date(), daysFromToday);
  return { date: toLocalDateKey(d), dayOfWeek: d.getDay() };
}
