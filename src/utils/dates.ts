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

/** Data relativa a hoje, usada nos dados de demonstração para a agenda parecer viva. */
export function relativeDate(daysFromToday: number): { date: string; dayOfWeek: number } {
  const d = addDays(new Date(), daysFromToday);
  return { date: toLocalDateKey(d), dayOfWeek: d.getDay() };
}
