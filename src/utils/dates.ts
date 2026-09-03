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

/** Data relativa a hoje, usada nos dados de demonstração para a agenda parecer viva. */
export function relativeDate(daysFromToday: number): { date: string; dayOfWeek: number } {
  const d = addDays(new Date(), daysFromToday);
  return { date: toLocalDateKey(d), dayOfWeek: d.getDay() };
}
