import { describe, it, expect } from 'vitest';
import { getFirstName, getGreeting } from './names';

describe('nome e saudação', () => {
  it('remove títulos antes do primeiro nome', () => {
    expect(getFirstName('Prof. Roberto Almeida')).toBe('Roberto');
    expect(getFirstName('Profa. Ana Lima')).toBe('Ana');
    expect(getFirstName('Dr. Carlos Silva')).toBe('Carlos');
    expect(getFirstName('Professora Maria')).toBe('Maria');
  });

  it('mantém nomes sem título e trata vazios', () => {
    expect(getFirstName('Carlos Silva')).toBe('Carlos');
    expect(getFirstName('  Mariana  Costa ')).toBe('Mariana');
    expect(getFirstName('')).toBe('');
    expect(getFirstName('Prof.')).toBe('Prof.');
  });

  it('saudação segue a hora do dia', () => {
    expect(getGreeting(new Date(2026, 8, 3, 8))).toBe('Bom dia');
    expect(getGreeting(new Date(2026, 8, 3, 11, 59))).toBe('Bom dia');
    expect(getGreeting(new Date(2026, 8, 3, 12))).toBe('Boa tarde');
    expect(getGreeting(new Date(2026, 8, 3, 17, 59))).toBe('Boa tarde');
    expect(getGreeting(new Date(2026, 8, 3, 18))).toBe('Boa noite');
    expect(getGreeting(new Date(2026, 8, 3, 23))).toBe('Boa noite');
  });
});
