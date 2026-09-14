import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';

/**
 * O link de "Esqueci minha senha" não coloca ninguém dentro do sistema.
 *
 * A pessoa clicava no link do e-mail e caía direto no painel, sem criar senha
 * nova. Aqui o Supabase é simulado para provar o caminho certo: tela de senha
 * nova, e o painel só depois de gravar.
 */
const { getSession, onAuthStateChange, link, atualizarSenha, signOut } = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  link: { recuperacao: false, erro: null as string | null },
  atualizarSenha: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('./lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { auth: { getSession, onAuthStateChange } },
}));

// O que o endereço trouxe é controlado por teste
vi.mock('./utils/linkDeAcesso', () => ({ LINK_DE_ACESSO: link }));

vi.mock('./services/supabaseService', () => ({
  supabaseService: new Proxy(
    {},
    {
      get: (_alvo, nome) =>
        nome === 'atualizarSenha' ? atualizarSenha : nome === 'signOut' ? signOut : vi.fn().mockResolvedValue(null),
    }
  ),
}));

import App from './App';

const CHAVE = 'agenda_prof_current_user';
const sessaoDoLink = { user: { id: 'u1', email: 'prof@exemplo.com', user_metadata: { role: 'professor' } } };

function abrir(hash = '') {
  window.history.replaceState(null, '', `/${hash}`);
  return render(<App />);
}

async function digitarSenhaNova(senha: string) {
  fireEvent.change(await screen.findByLabelText('Senha nova'), { target: { value: senha } });
  fireEvent.change(screen.getByLabelText('Repita a senha nova'), { target: { value: senha } });
  fireEvent.click(screen.getByRole('button', { name: /salvar senha nova/i }));
}

beforeEach(() => {
  localStorage.clear();
  link.recuperacao = false;
  link.erro = null;
  getSession.mockReset();
  onAuthStateChange.mockReset();
  onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  atualizarSenha.mockReset();
  signOut.mockReset();
  signOut.mockResolvedValue(true);
});

describe('chegando pelo link de redefinição de senha', () => {
  it('mostra "Crie sua nova senha" e não abre o painel', async () => {
    link.recuperacao = true;
    getSession.mockResolvedValue({ data: { session: sessaoDoLink } });

    abrir();

    expect(await screen.findByRole('heading', { name: /crie sua nova senha/i })).toBeInTheDocument();
    expect(localStorage.getItem(CHAVE)).toBeNull();
    expect(screen.queryByRole('heading', { name: /entrar no sistema/i })).not.toBeInTheDocument();
  });

  it('o aviso PASSWORD_RECOVERY do Supabase também fecha o painel e pede a senha', async () => {
    getSession.mockResolvedValue({ data: { session: sessaoDoLink } });
    abrir('#/painel');
    await act(async () => {
      await Promise.resolve();
    });

    const aoMudarSessao = onAuthStateChange.mock.calls[0][0];
    await act(async () => {
      await aoMudarSessao('PASSWORD_RECOVERY', sessaoDoLink);
    });

    expect(await screen.findByRole('heading', { name: /crie sua nova senha/i })).toBeInTheDocument();
    expect(localStorage.getItem(CHAVE)).toBeNull();

    // Outros avisos com a mesma sessão (renovação do token) não abrem o painel
    await act(async () => {
      await aoMudarSessao('TOKEN_REFRESHED', sessaoDoLink);
    });
    expect(screen.getByRole('heading', { name: /crie sua nova senha/i })).toBeInTheDocument();
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });

  it('só depois de gravar a senha nova a pessoa entra', async () => {
    link.recuperacao = true;
    getSession.mockResolvedValue({ data: { session: sessaoDoLink } });
    atualizarSenha.mockResolvedValue({ error: null });

    abrir();
    await digitarSenhaNova('senhaNova123');

    expect(atualizarSenha).toHaveBeenCalledWith('senhaNova123');
    expect(localStorage.getItem(CHAVE)).toBeNull();

    fireEvent.click(await screen.findByRole('button', { name: /entrar no sistema/i }));

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByRole('heading', { name: /crie sua nova senha/i })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(CHAVE) || '{}').email).toBe('prof@exemplo.com');
  });

  it('senha recusada pelo servidor mantém a pessoa fora do painel', async () => {
    link.recuperacao = true;
    getSession.mockResolvedValue({ data: { session: sessaoDoLink } });
    atualizarSenha.mockResolvedValue({ error: 'A senha nova precisa ser diferente da senha atual.' });

    abrir();
    await digitarSenhaNova('senhaNova123');

    expect(await screen.findByRole('alert')).toHaveTextContent(/diferente da senha atual/i);
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });

  it('cancelar encerra a sessão do link e volta para Entrar', async () => {
    link.recuperacao = true;
    getSession.mockResolvedValue({ data: { session: sessaoDoLink } });

    abrir();
    fireEvent.click(await screen.findByRole('button', { name: /cancelar e voltar/i }));

    expect(await screen.findByRole('heading', { name: /entrar no sistema/i })).toBeInTheDocument();
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });

  it('link que o servidor não aceitou avisa que venceu', async () => {
    link.recuperacao = true;
    getSession.mockResolvedValue({ data: { session: null } });

    abrir();

    expect(await screen.findByRole('heading', { name: /entrar no sistema/i })).toBeInTheDocument();
    expect(screen.getByText(/link expirou/i)).toBeInTheDocument();
  });

  it('link vencido (#error_code=otp_expired) abre Entrar com o aviso em português', async () => {
    link.erro = 'Este link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".';
    getSession.mockResolvedValue({ data: { session: null } });

    abrir();

    expect(await screen.findByRole('heading', { name: /entrar no sistema/i })).toBeInTheDocument();
    expect(screen.getByText(/link expirou/i)).toBeInTheDocument();
  });
});
