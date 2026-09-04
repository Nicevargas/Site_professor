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
