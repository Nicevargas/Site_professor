import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { AuthUser } from './types';

function loginAs(user: Partial<AuthUser> & { role: AuthUser['role'] }) {
  const full: AuthUser = {
    id: user.id || `demo-${user.role}`,
    email: user.email || `${user.role}@teste.com`,
    name: user.name || `Usuário ${user.role}`,
    role: user.role,
    teacherId: user.teacherId,
    studentId: user.studentId,
    isDemo: true,
  };
  localStorage.setItem('agenda_prof_current_user', JSON.stringify(full));
}

function openAt(hash: string) {
  window.history.replaceState(null, '', `/${hash}`);
  return render(<App />);
}

describe('App: rotas e guarda por papel', () => {
  it('visitante sem sessão cai no site público', async () => {
    openAt('');
    expect(await screen.findByRole('heading', { level: 1, name: /roberto almeida/i })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/');
  });

  it('visitante que abre uma tela interna vê a tela de login', async () => {
    openAt('#/agenda');
    expect(await screen.findByRole('heading', { name: /entrar no sistema/i })).toBeInTheDocument();
  });

  it('aluno que tenta abrir o financeiro é levado ao portal', async () => {
    loginAs({ role: 'aluno', name: 'Mariana Costa', studentId: 'std-1', teacherId: 'prof-roberto' });
    openAt('#/financeiro');
    expect(await screen.findByText(/olá, mariana/i)).toBeInTheDocument();
    await waitFor(() => expect(window.location.hash).toBe('#/portal'));
    expect(screen.queryByText(/cobrar \/ enviar link de pagamento/i)).not.toBeInTheDocument();
  });

  it('secretaria que tenta abrir usuários é levada ao painel', async () => {
    loginAs({ role: 'assistente', name: 'Camila Fernandes', teacherId: 'prof-roberto' });
    openAt('#/usuarios');
    await waitFor(() => expect(window.location.hash).toBe('#/painel'));
    expect(await screen.findByText(/aqui está o resumo do seu dia/i)).toBeInTheDocument();
    // sem cartão de faturamento nem seletor de perfis para a secretaria
    expect(screen.queryByText(/faturamento & cobranças/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/assumir outro perfil/i)).not.toBeInTheDocument();
  });

  it('professor abre Meu Site pela URL', async () => {
    loginAs({ role: 'professor', id: 'prof-roberto', name: 'Prof. Roberto Almeida', email: 'roberto.almeida@agendaprofessor.com.br' });
    openAt('#/meu-site');
    expect(await screen.findByText(/painel admin do site do professor/i)).toBeInTheDocument();
    expect(window.location.hash).toBe('#/meu-site');
    expect(screen.queryByTitle(/assumir outro perfil/i)).not.toBeInTheDocument();
  });

  it('admin mantém o seletor de perfis e a tela de usuários', async () => {
    loginAs({ role: 'admin', name: 'Admin Geral' });
    openAt('#/usuarios');
    await waitFor(() => expect(window.location.hash).toBe('#/usuarios'));
    expect(await screen.findByTitle(/assumir outro perfil/i)).toBeInTheDocument();
  });

  it('aluno em Meus Dados edita só os próprios dados, não o perfil do professor', async () => {
    loginAs({ role: 'aluno', name: 'Mariana Costa', studentId: 'std-1', teacherId: 'prof-roberto' });
    openAt('#/configuracoes');
    expect(await screen.findByRole('heading', { level: 1, name: /meus dados/i })).toBeInTheDocument();
    expect(screen.queryByText(/configurações do professor/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/chave pix/i)).not.toBeInTheDocument();
  });
});
