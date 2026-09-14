import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

/**
 * Ninguém entra no painel sem login válido no servidor.
 *
 * Pessoas estavam entrando direto no sistema: o app abria o painel com o
 * usuário que ficou guardado no navegador, sem conferir se a sessão ainda
 * valia -- e essa cópia é editável. Aqui o Supabase é simulado para provar o
 * que acontece quando o servidor diz que não há sessão.
 */
const { getSession, onAuthStateChange } = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

vi.mock('./lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { auth: { getSession, onAuthStateChange } },
}));

// O banco não entrega nada: o teste é sobre quem entra, não sobre os dados
vi.mock('./services/supabaseService', () => ({
  supabaseService: new Proxy(
    {},
    { get: () => vi.fn().mockResolvedValue(null) }
  ),
}));

import App from './App';

const CHAVE = 'agenda_prof_current_user';
const adminForjado = JSON.stringify({ id: 'x', email: 'x@x.com', name: 'Forjado', role: 'admin' });

function abrirEm(hash: string) {
  window.history.replaceState(null, '', `/${hash}`);
  return render(<App />);
}

beforeEach(() => {
  localStorage.clear();
  getSession.mockReset();
  onAuthStateChange.mockReset();
  onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
});

describe('acesso ao painel com o banco ligado', () => {
  it('cópia de admin forjada no navegador, sem sessão, cai na tela de entrar', async () => {
    localStorage.setItem(CHAVE, adminForjado);
    getSession.mockResolvedValue({ data: { session: null } });

    abrirEm('#/painel');

    expect(await screen.findByRole('heading', { name: /entrar no sistema/i })).toBeInTheDocument();
    // A cópia que abria o painel é apagada
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });

  it('enquanto o servidor não responde, mostra "Verificando seu acesso", não o painel', () => {
    localStorage.setItem(CHAVE, adminForjado);
    getSession.mockReturnValue(new Promise(() => {})); // nunca responde

    abrirEm('#/painel');

    expect(screen.getByText(/verificando seu acesso/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /entrar no sistema/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/dashboard geral/i)).not.toBeInTheDocument();
  });

  it('sessão que acaba em outra aba fecha o painel', async () => {
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1', email: 'prof@exemplo.com', user_metadata: {} } } },
    });

    abrirEm('#/painel');
    // Espera a sessão ser aplicada antes de encerrá-la
    await act(async () => {
      await Promise.resolve();
    });

    const aoMudarSessao = onAuthStateChange.mock.calls[0][0];
    await act(async () => {
      await aoMudarSessao('SIGNED_OUT', null);
    });

    expect(await screen.findByRole('heading', { name: /entrar no sistema/i })).toBeInTheDocument();
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });
});
