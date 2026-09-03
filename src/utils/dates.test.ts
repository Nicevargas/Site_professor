import { describe, it, expect } from 'vitest';
import { toLocalDateKey, addDays, relativeDate } from './dates';

describe('datas locais', () => {
  it('formata YYYY-MM-DD com zero à esquerda, sem fuso UTC', () => {
    expect(toLocalDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toLocalDateKey(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });

  it('soma dias atravessando o fim do mês', () => {
    expect(toLocalDateKey(addDays(new Date(2026, 0, 30), 3))).toBe('2026-02-02');
    expect(toLocalDateKey(addDays(new Date(2026, 2, 1), -1))).toBe('2026-02-28');
  });

  it('data relativa devolve chave e dia da semana coerentes', () => {
    const today = new Date();
    const rel = relativeDate(0);
    expect(rel.date).toBe(toLocalDateKey(today));
    expect(rel.dayOfWeek).toBe(today.getDay());

    const nextWeek = relativeDate(7);
    expect(nextWeek.dayOfWeek).toBe(today.getDay());
    expect(nextWeek.date > rel.date).toBe(true);
  });
});
