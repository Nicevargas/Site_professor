import { describe, it, expect } from 'vitest';
import {
  adicionarHorario,
  copiarHorarios,
  diasQueSeraoSubstituidos,
  gradeEfetiva,
  horariosDoDia,
  listaDeDias,
  mesmaGrade,
  normalizarGrade,
  periodoDoHorario,
  proximosDiasComAula,
  removerHorario,
} from './gradeSemanal';

describe('grade de horários de aula', () => {
  it('professor que nunca configurou continua com os horários de antes', () => {
    const grade = gradeEfetiva(undefined);
    expect(horariosDoDia(grade, 1)).toEqual(['09:00', '10:30', '14:00', '15:30', '17:00']);
    expect(horariosDoDia(grade, 5)).toEqual(['09:00', '10:30', '14:00', '15:30', '17:00']);
    expect(horariosDoDia(grade, 6)).toEqual([]);
    expect(horariosDoDia(gradeEfetiva(null), 0)).toEqual([]);
  });

  it('grade salva vazia é respeitada: não volta para o padrão', () => {
    expect(gradeEfetiva({})).toEqual({});
  });

  it('limpa o que vem do banco: ordena, tira repetido e horário inválido', () => {
    expect(
      normalizarGrade({ '2': ['14:00', '07:00', '14:00', '25:00', 'abc', 7], 3: [], 9: ['10:00'] })
    ).toEqual({ 2: ['07:00', '14:00'] });
    expect(normalizarGrade(null)).toEqual({});
    expect(normalizarGrade(['09:00'])).toEqual({});
  });

  it('adiciona sem duplicar e remove', () => {
    const grade = adicionarHorario({ 1: ['18:00'] }, 1, '07:00');
    expect(grade).toEqual({ 1: ['07:00', '18:00'] });
    expect(adicionarHorario(grade, 1, '07:00')).toEqual({ 1: ['07:00', '18:00'] });
    expect(adicionarHorario(grade, 1, '7h')).toEqual({ 1: ['07:00', '18:00'] });
    expect(removerHorario(grade, 1, '18:00')).toEqual({ 1: ['07:00'] });
    expect(removerHorario({ 1: ['07:00'] }, 1, '07:00')).toEqual({});
  });

  it('copia os horários de um dia para os dias marcados, sem mexer no original', () => {
    const grade = { 1: ['07:00', '18:00'], 2: ['10:00'] };
    expect(copiarHorarios(grade, 1, [2, 4, 1])).toEqual({
      1: ['07:00', '18:00'],
      2: ['07:00', '18:00'],
      4: ['07:00', '18:00'],
    });
    expect(grade[2]).toEqual(['10:00']);
  });

  it('diz quais dias vão perder os horários que já tinham', () => {
    const grade = { 1: ['07:00'], 2: ['10:00'], 3: ['07:00'] };
    // Quarta já é igual e quinta está vazia: só terça perde algo
    expect(diasQueSeraoSubstituidos(grade, 1, [2, 3, 4])).toEqual([2]);
  });

  it('compara grades sem ligar para ordem ou chave em texto', () => {
    expect(mesmaGrade({ '1': ['14:00', '07:00'] }, { 1: ['07:00', '14:00'] })).toBe(true);
    expect(mesmaGrade({ 1: ['07:00'] }, { 1: ['07:00'], 2: ['07:00'] })).toBe(false);
  });

  it('próximos dias do agendamento são só os que têm aula', () => {
    const segunda = new Date(2026, 8, 14, 10, 0); // 14/09/2026
    const dias = proximosDiasComAula({ 3: ['07:00'], 5: ['19:00'] }, 3, segunda);
    expect(dias.map((d) => d.date)).toEqual(['2026-09-16', '2026-09-18', '2026-09-23']);
    expect(dias[0]).toMatchObject({ label: 'Qua, 16 Set', dayOfWeek: 3 });
  });

  it('sem nenhum horário não há dia para oferecer (e não trava)', () => {
    expect(proximosDiasComAula({}, 5, new Date(2026, 8, 14))).toEqual([]);
  });

  it('nomes e períodos em português', () => {
    expect(listaDeDias([6, 2, 4])).toBe('Terça, Quinta e Sábado');
    expect(listaDeDias([0])).toBe('Domingo');
    expect(periodoDoHorario('07:00')).toBe('Manhã');
    expect(periodoDoHorario('12:00')).toBe('Tarde');
    expect(periodoDoHorario('19:30')).toBe('Noite');
  });
});
