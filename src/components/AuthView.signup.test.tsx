import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthView } from './AuthView';
import { TeacherProfile } from '../types';

/**
 * Cadastro COM banco ligado.
 *
 * O bug que estes testes travam: a tela inseria a linha em system_users antes
 * de criar a conta no Supabase Auth. Naquele instante não existia sessão, então
 * a escrita ia como anônima e o RLS recusava — o usuário via
 * "Não foi possível salvar: usuário" em todo cadastro.
 * Quem cria a linha é o gatilho on_auth_user_created, a partir do metadata.
 */

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: null,
}));

const signUp = vi.fn();
const saveSystemUser = vi.fn();

vi.mock('../services/supabaseService', () => ({
  supabaseService: {
    signUp: (...args: unknown[]) => signUp(...args),
    saveSystemUser: (...args: unknown[]) => saveSystemUser(...args),
    signIn: vi.fn().mockResolvedValue({ data: null, error: 'sem conta' }),
    findUserByEmail: vi.fn().mockResolvedValue(null),
  },
}));

const teacher: TeacherProfile = {
  id: 'prof-roberto', name: 'Prof. Roberto Almeida', role: 'Personal Trainer',
  specialty: 'Treino', bio: '', rating: 5, reviewCount: 1, yearsExperience: 1,
  avatarUrl: '', heroImageUrl: '', whatsapp: '5511999999999', email: 'roberto@teste.com',
};

function renderAuth() {
  const onLoginSuccess = vi.fn();
  render(<AuthView currentTeacher={teacher} onLoginSuccess={onLoginSuccess} onBackToPublicSite={() => {}} />);
  return { onLoginSuccess };
}

async function preencherCadastro(role: 'professor' | 'aluno' = 'professor', whatsapp?: string) {
  fireEvent.click(screen.getByRole('button', { name: /criar cadastro/i }));
  fireEvent.change(screen.getByPlaceholderText(/dra\. juliana santos/i), { target: { value: 'Nova Pessoa' } });
  fireEvent.change(screen.getByPlaceholderText(/seu-email@exemplo/i), { target: { value: 'Nova@Teste.com ' } });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: role } });
  if (whatsapp) {
    const campoWhats = screen.queryByPlaceholderText(/\(11\) 9/);
    if (campoWhats) fireEvent.change(campoWhats, { target: { value: whatsapp } });
  }
  const [pass, confirm] = screen.getAllByPlaceholderText('••••••••');
  fireEvent.change(pass, { target: { value: 'senha123' } });
  fireEvent.change(confirm, { target: { value: 'senha123' } });
  fireEvent.click(screen.getByRole('button', { name: /criar conta e acessar/i }));
}

describe('cadastro com Supabase ligado', () => {
  beforeEach(() => {
    localStorage.clear();
    signUp.mockReset().mockResolvedValue({ data: { user: { id: 'uuid-1' } }, error: null });
    saveSystemUser.mockReset().mockResolvedValue(true);
  });

  it('não tenta escrever em system_users por fora: quem cria a linha é o gatilho', async () => {
    renderAuth();
    await preencherCadastro();

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1));
    expect(saveSystemUser).not.toHaveBeenCalled();
  });

  it('manda papel e telefone no metadata, senão todo cadastro virava professor', async () => {
    renderAuth();
    await preencherCadastro('aluno', '(11) 98888-7777');

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1));
    const [email, senha, nome, perfil] = signUp.mock.calls[0];
    expect(email).toBe('nova@teste.com');
    expect(senha).toBe('senha123');
    expect(nome).toBe('Nova Pessoa');
    expect(perfil).toMatchObject({ role: 'aluno' });
  });

  it('erro do Supabase aparece na tela e não deixa entrar', async () => {
    signUp.mockResolvedValue({ data: null, error: 'Este e-mail já está cadastrado. Tente entrar.' });
    const { onLoginSuccess } = renderAuth();
    await preencherCadastro();

    await waitFor(() => expect(screen.getByText(/já está cadastrado/i)).toBeInTheDocument());
    expect(onLoginSuccess).not.toHaveBeenCalled();
  });

  it('cadastro bem-sucedido entra no sistema com o papel escolhido', async () => {
    vi.useFakeTimers();
    const { onLoginSuccess } = renderAuth();
    await preencherCadastro('aluno');
    await vi.waitFor(() => expect(signUp).toHaveBeenCalledTimes(1));

    vi.advanceTimersByTime(2000);
    vi.useRealTimers();

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledTimes(1));
    expect(onLoginSuccess.mock.calls[0][0]).toMatchObject({ role: 'aluno', email: 'nova@teste.com' });
  });
});
