import { describe, it, expect } from 'vitest';
import { diaDaSemanaDaAula, valorDaAula } from './valoresDaAula';

describe('dia da semana da aula', () => {
  it('domingo é domingo (0), não segunda', () => {
    expect(diaDaSemanaDaAula('2026-09-20')).toBe(0); // domingo
  });

  it('sábado é 6', () => {
    expect(diaDaSemanaDaAula('2026-09-19')).toBe(6);
  });

  it('a data vence um dia gravado errado', () => {
    // Aula antiga de domingo que foi gravada como segunda
    expect(diaDaSemanaDaAula('2026-09-20', 1)).toBe(0);
  });

  it('sem data, o dia informado vale, inclusive 0', () => {
    expect(diaDaSemanaDaAula(undefined, 0)).toBe(0);
    expect(diaDaSemanaDaAula('', '0')).toBe(0);
    expect(diaDaSemanaDaAula(null, 5)).toBe(5);
  });

  it('sem data nem dia válido, segunda como antes', () => {
    expect(diaDaSemanaDaAula(undefined, undefined)).toBe(1);
    expect(diaDaSemanaDaAula('20/09/2026', 9)).toBe(1);
  });
});

describe('valor da aula', () => {
  it('aula gratuita fica R$ 0', () => {
    expect(valorDaAula(0)).toBe(0);
    expect(valorDaAula('0')).toBe(0);
    expect(valorDaAula('0.00')).toBe(0);
  });

  it('valor informado fica como está', () => {
    expect(valorDaAula(89.9)).toBe(89.9);
    expect(valorDaAula('120.50')).toBe(120.5);
  });

  it('só valor ausente ou inválido usa o padrão de R$ 150', () => {
    expect(valorDaAula(null)).toBe(150);
    expect(valorDaAula(undefined)).toBe(150);
    expect(valorDaAula('')).toBe(150);
    expect(valorDaAula('abc')).toBe(150);
    expect(valorDaAula(-10)).toBe(150);
  });
});
