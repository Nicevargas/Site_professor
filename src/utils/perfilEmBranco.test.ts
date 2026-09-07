import { describe, it, expect } from 'vitest';
import { PERFIL_EM_BRANCO, perfilVazio } from './perfilEmBranco';
import { INITIAL_TEACHER_PROFILES } from '../data/mockData';
import { TeacherProfile } from '../types';

describe('perfil em branco', () => {
  it('não carrega o nome de ninguém: era daí que vinha o professor de demonstração', () => {
    expect(PERFIL_EM_BRANCO.name).toBe('');
    expect(PERFIL_EM_BRANCO.id).toBe('');
    const nomesDeExemplo = INITIAL_TEACHER_PROFILES.map((t) => t.name);
    expect(nomesDeExemplo).not.toContain(PERFIL_EM_BRANCO.name || '(vazio)');
  });

  it('não traz endereço: um molde com slug roubaria a vitrine de um professor real', () => {
    expect(PERFIL_EM_BRANCO.slug).toBeUndefined();
    expect(PERFIL_EM_BRANCO.customDomain).toBeUndefined();
  });

  it('reconhece que ainda não veio ninguém do banco', () => {
    expect(perfilVazio(PERFIL_EM_BRANCO)).toBe(true);
    expect(perfilVazio(null)).toBe(true);
    expect(perfilVazio(undefined)).toBe(true);
  });

  it('professor de verdade não é confundido com o molde', () => {
    expect(perfilVazio(INITIAL_TEACHER_PROFILES[0])).toBe(false);
    // O id é o que decide: perfil recém-criado, ainda sem nada preenchido,
    // continua sendo alguém -- e a vitrine dele deve abrir.
    expect(perfilVazio({ ...PERFIL_EM_BRANCO, id: 'abc' } as TeacherProfile)).toBe(false);
  });
});
