import { describe, it, expect } from 'vitest';
import {
  toLocalDateKey, addDays, relativeDate,
  parseDateKey, startOfWeek, buildWeek, buildMonthGrid, formatWeekRange,
} from './dates';

describe('semana e mês do calendário', () => {
  it('parseDateKey lê a data no fuso local, sem voltar um dia', () => {
    const d = parseDateKey('2026-09-04');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(4);
  });

  it('a semana começa na segunda, inclusive quando a âncora é domingo', () => {
    // 2026-09-06 é um domingo; a semana dele começa em 31/08 (segunda)
    expect(toLocalDateKey(startOfWeek(parseDateKey('2026-09-06')))).toBe('2026-08-31');
    // 2026-09-07 é segunda: começa nela mesma
    expect(toLocalDateKey(startOfWeek(parseDateKey('2026-09-07')))).toBe('2026-09-07');
  });

  it('buildWeek devolve sete dias em ordem, marcando fim de semana e hoje', () => {
    const week = buildWeek(parseDateKey('2026-09-09'), parseDateKey('2026-09-09'));
    expect(week).toHaveLength(7);
    expect(week[0].date).toBe('2026-09-07');
    expect(week[0].dayName).toBe('Seg');
    expect(week[6].date).toBe('2026-09-13');
    expect(week[6].dayName).toBe('Dom');
    expect(week.filter((d) => d.isWeekend).map((d) => d.dayName)).toEqual(['Sáb', 'Dom']);
    expect(week.filter((d) => d.isToday).map((d) => d.date)).toEqual(['2026-09-09']);
  });

  it('a grade do mês começa no domingo, termina no sábado e marca dias de fora', () => {
    const grid = buildMonthGrid(parseDateKey('2026-09-15'), parseDateKey('2026-09-15'));
    expect(grid.length % 7).toBe(0);
    expect(grid[0].dayOfWeek).toBe(0);
    expect(grid[grid.length - 1].dayOfWeek).toBe(6);
    expect(grid.filter((d) => d.inMonth)).toHaveLength(30); // setembro
    expect(grid.some((d) => !d.inMonth)).toBe(true);
  });

  it('o título da semana mostra um mês só, ou os dois quando ela vira o mês', () => {
    expect(formatWeekRange(buildWeek(parseDateKey('2026-09-09')))).toBe('7 - 13 de Setembro');
    expect(formatWeekRange(buildWeek(parseDateKey('2026-10-01')))).toBe('28 Set - 4 Out');
  });
});

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
