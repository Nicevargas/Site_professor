import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthView } from './AuthView';
import { TeacherProfile } from '../types';

const teacher: TeacherProfile = {
  id: 'prof-roberto',
  name: 'Prof. Roberto Almeida',
  role: 'Personal Trainer',
  specialty: 'Treino',
  bio: '',
  rating: 5,
  reviewCount: 1,
  yearsExperience: 1,
  avatarUrl: 'https://example.com/a.png',
  heroImageUrl: '',
  whatsapp: '5511999999999',
  email: 'roberto@teste.com',
};

function renderAuth() {
  const onLoginSuccess = vi.fn();
  render(<AuthView currentTeacher={teacher} onLoginSuccess={onLoginSuccess} onBackToPublicSite={() => {}} />);
  return { onLoginSuccess };
}

const emailField = () => screen.getByPlaceholderText(/admin@\.\.\. ou roberto@/i);
const passwordField = () => screen.getByPlaceholderText('••••••••');

async function signUp(name: string, email: string, password: string, role: 'professor' | 'aluno' = 'professor') {
  fireEvent.click(screen.getByRole('button', { name: /criar cadastro/i }));
  fireEvent.change(screen.getByPlaceholderText(/dra\. juliana santos/i), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText(/seu-email@exemplo/i), { target: { value: email } });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: role } });
  const [pass, confirm] = screen.getAllByPlaceholderText('••••••••');
  fireEvent.change(pass, { target: { value: password } });
  fireEvent.change(confirm, { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: /criar conta e acessar/i }));
}

describe('tela de login (modo demonstração, sem banco)', () => {
  it('não expõe acesso master nem permite se cadastrar como admin ou secretaria', () => {
    renderAuth();
    expect(screen.queryByText(/acesso master/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/curtatche/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /criar cadastro/i }));
    const options = screen.getAllByRole('option').map((o) => (o as HTMLOptionElement).value);
    expect(options).toEqual(['professor', 'aluno']);
  });

  it('atalhos de demonstração entram com o papel escolhido', () => {
    const { onLoginSuccess } = renderAuth();
    fireEvent.click(screen.getByText(/mariana \(aluna\)/i));
    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    expect(onLoginSuccess.mock.calls[0][0]).toMatchObject({ role: 'aluno', isDemo: true, studentId: 'std-1' });
  });

  it('cadastro local guarda a senha em hash e o login exige a senha certa', async () => {
    const { onLoginSuccess } = renderAuth();
    await signUp('Ana Lima', 'ana@teste.com', 'segredo123', 'aluno');

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(onLoginSuccess.mock.calls[0][0]).toMatchObject({ email: 'ana@teste.com', role: 'aluno', isDemo: false });

    const stored = JSON.parse(localStorage.getItem('agenda_prof_registered_users') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].passwordHash).not.toBe('segredo123');
    expect(stored[0].passwordHash).toMatch(/^[0-9a-f]{64}$/);
    expect(stored[0].role).toBe('aluno');
  });

  it('senha errada em cadastro local é recusada', async () => {
    const { onLoginSuccess } = renderAuth();
    await signUp('Ana Lima', 'ana@teste.com', 'segredo123');
    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledTimes(1), { timeout: 3000 });

    // volta para o login e tenta com outra senha
    fireEvent.click(screen.getAllByRole('button', { name: /entrar \(login\)/i })[0]);
    fireEvent.change(emailField(), { target: { value: 'ana@teste.com' } });
    fireEvent.change(passwordField(), { target: { value: 'outra-senha' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar no sistema/i }));

    expect(await screen.findByText(/senha incorreta/i, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
  });

  it('cadastro pedindo papel admin vira professor', async () => {
    const { onLoginSuccess } = renderAuth();
    fireEvent.click(screen.getByRole('button', { name: /criar cadastro/i }));
    fireEvent.change(screen.getByPlaceholderText(/dra\. juliana santos/i), { target: { value: 'Intruso' } });
    fireEvent.change(screen.getByPlaceholderText(/seu-email@exemplo/i), { target: { value: 'intruso@teste.com' } });
    // força um valor fora das opções, como um formulário manipulado faria
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'admin' } });
    const [pass, confirm] = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(pass, { target: { value: 'segredo123' } });
    fireEvent.change(confirm, { target: { value: 'segredo123' } });
    fireEvent.click(screen.getByRole('button', { name: /criar conta e acessar/i }));

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(onLoginSuccess.mock.calls[0][0].role).not.toBe('admin');
    expect(['professor', 'aluno']).toContain(onLoginSuccess.mock.calls[0][0].role);
  });
});
