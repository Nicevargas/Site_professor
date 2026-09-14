import { describe, it, expect } from 'vitest';
import { CHAVE_USUARIO, sessaoEncerrada, usuarioGuardado } from './sessao';

const armazenamentoCom = (valor: string | null) => ({
  getItem: (chave: string) => (chave === CHAVE_USUARIO ? valor : null),
});

const adminForjado = JSON.stringify({ id: 'x', email: 'x@x', role: 'admin' });

describe('usuário guardado no navegador', () => {
  it('com o banco ligado, não vale como login', () => {
    // Era assim que se entrava direto: a cópia do navegador abria o painel
    expect(usuarioGuardado(armazenamentoCom(adminForjado), true)).toBeNull();
  });

  it('ninguém vira admin editando o navegador', () => {
    const usuario = usuarioGuardado(armazenamentoCom(adminForjado), true);
    expect(usuario?.role).toBeUndefined();
  });

  it('sem banco (modo demonstração), a cópia continua valendo', () => {
    expect(usuarioGuardado(armazenamentoCom(adminForjado), false)?.role).toBe('admin');
  });

  it('cópia corrompida ou ausente não quebra a abertura do app', () => {
    expect(usuarioGuardado(armazenamentoCom('{isto não é json'), false)).toBeNull();
    expect(usuarioGuardado(armazenamentoCom(null), false)).toBeNull();
    expect(usuarioGuardado(null, false)).toBeNull();
  });

  it('navegador que proíbe ler o armazenamento também não quebra', () => {
    const bloqueado = { getItem: () => { throw new Error('bloqueado'); } };
    expect(usuarioGuardado(bloqueado, false)).toBeNull();
  });
});

describe('sessão do servidor', () => {
  it('sem sessão, o acesso está encerrado', () => {
    expect(sessaoEncerrada(null)).toBe(true);
    expect(sessaoEncerrada(undefined)).toBe(true);
    expect(sessaoEncerrada({})).toBe(true);
    expect(sessaoEncerrada({ user: null })).toBe(true);
  });

  it('com usuário na sessão, o acesso continua', () => {
    expect(sessaoEncerrada({ user: { id: 'u1' } })).toBe(false);
  });
});
