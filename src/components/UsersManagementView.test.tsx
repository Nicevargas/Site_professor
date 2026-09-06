import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { UsersManagementView } from './UsersManagementView';
import { AuthUser, Company, SystemUser, TeacherProfile } from '../types';

const teachers: TeacherProfile[] = [
  {
    id: 'prof-roberto', name: 'Prof. Roberto Almeida', companyId: 'comp-1', role: 'Personal Trainer',
    specialty: '', bio: '', rating: 5, reviewCount: 1, yearsExperience: 1,
    avatarUrl: '', heroImageUrl: '', whatsapp: '', email: 'roberto@teste.com',
  },
  {
    id: 'prof-carlos', name: 'Prof. Carlos Silva', role: 'Instrutor',
    specialty: '', bio: '', rating: 5, reviewCount: 1, yearsExperience: 1,
    avatarUrl: '', heroImageUrl: '', whatsapp: '', email: 'carlos@teste.com',
  },
];

const companies: Company[] = [
  { id: 'comp-1', name: 'Centro Esportivo Aqua Vida', status: 'ativa', createdAt: '2026-01-01' },
];

const admin: AuthUser = { id: 'user-admin', email: 'admin@teste.com', role: 'admin' };

function user(over: Partial<SystemUser> = {}): SystemUser {
  return {
    id: 'user-1', name: 'Camila Fernandes', email: 'camila@teste.com', role: 'assistente',
    teacherId: 'prof-roberto', status: 'ativo', createdAt: '2026-01-01', ...over,
  };
}

function renderView(users: SystemUser[], overrides: Partial<React.ComponentProps<typeof UsersManagementView>> = {}) {
  const onAddUser = vi.fn();
  const onUpdateUser = vi.fn();
  const onSaveCompany = vi.fn();
  render(
    <UsersManagementView
      users={users}
      teachers={teachers}
      companies={companies}
      currentUser={admin}
      onAddUser={onAddUser}
      onUpdateUser={onUpdateUser}
      onDeleteUser={vi.fn()}
      onSwitchUser={vi.fn()}
      onSaveCompany={onSaveCompany}
      onDeleteCompany={vi.fn()}
      {...overrides}
    />
  );
  return { onAddUser, onUpdateUser, onSaveCompany };
}

const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;

describe('vínculo de usuários com empresa e professor', () => {
  it('a lista mostra a empresa e o professor de cada usuário', () => {
    renderView([user()]);
    const row = rowOf('Camila Fernandes');
    // A empresa vem do professor vinculado, mesmo sem companyId no usuário
    expect(within(row).getByText('Centro Esportivo Aqua Vida')).toBeInTheDocument();
    expect(within(row).getByText('Prof. Roberto Almeida')).toBeInTheDocument();
  });

  it('admin da plataforma aparece sem vínculo, e não como erro', () => {
    renderView([user({ id: 'u-adm', name: 'Admin Geral', role: 'admin', teacherId: undefined })]);
    expect(within(rowOf('Admin Geral')).getByText(/plataforma \(sem vínculo\)/i)).toBeInTheDocument();
  });

  it('denuncia o professor apontando para um perfil que não existe', () => {
    renderView([user({ name: 'Fantasma', role: 'professor', teacherId: 'prof-1699999999999' })]);
    expect(within(rowOf('Fantasma')).getByRole('button', { name: /vínculo quebrado/i })).toBeInTheDocument();
  });

  it('avisa quando o usuário não tem vínculo nenhum', () => {
    renderView([user({ name: 'Solto', role: 'aluno', teacherId: undefined })]);
    expect(within(rowOf('Solto')).getByRole('button', { name: /sem vínculo/i })).toBeInTheDocument();
  });

  it('dá para corrigir o vínculo pela tela de edição', () => {
    const { onUpdateUser } = renderView([user({ name: 'Fantasma', role: 'professor', teacherId: 'prof-inexistente' })]);
    fireEvent.click(within(rowOf('Fantasma')).getByRole('button', { name: /vínculo quebrado/i }));

    fireEvent.change(screen.getByLabelText(/perfil de professor/i), { target: { value: 'prof-carlos' } });
    fireEvent.change(screen.getByLabelText(/empresa \/ escola/i), { target: { value: 'comp-1' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    expect(onUpdateUser).toHaveBeenCalledTimes(1);
    expect(onUpdateUser.mock.calls[0][1]).toMatchObject({ teacherId: 'prof-carlos', companyId: 'comp-1' });
  });

  it('cadastrar professor permite escolher um perfil existente em vez de inventar um id', () => {
    const { onAddUser } = renderView([]);
    fireEvent.click(screen.getByRole('button', { name: /novo usuário/i }));

    fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: 'Nova Professora' } });
    fireEvent.change(screen.getByLabelText(/e-mail de acesso/i), { target: { value: 'nova@teste.com' } });
    fireEvent.change(screen.getByLabelText(/perfil de professor/i), { target: { value: 'prof-carlos' } });
    fireEvent.change(screen.getByLabelText(/empresa \/ escola/i), { target: { value: 'comp-1' } });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar usuário/i }));

    expect(onAddUser).toHaveBeenCalledTimes(1);
    expect(onAddUser.mock.calls[0][0]).toMatchObject({
      role: 'professor',
      teacherId: 'prof-carlos',
      companyId: 'comp-1',
    });
  });

  it('admin cadastrado não recebe vínculo', () => {
    const { onAddUser } = renderView([]);
    fireEvent.click(screen.getByRole('button', { name: /novo usuário/i }));
    fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: 'Novo Admin' } });
    fireEvent.change(screen.getByLabelText(/e-mail de acesso/i), { target: { value: 'adm@teste.com' } });
    fireEvent.change(screen.getByLabelText(/nível de acesso/i), { target: { value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar usuário/i }));

    expect(onAddUser.mock.calls[0][0].teacherId).toBeUndefined();
    expect(onAddUser.mock.calls[0][0].companyId).toBeUndefined();
  });
});

describe('empresas', () => {
  it('a aba de empresas só existe para quem pode gerenciá-las', () => {
    renderView([user()], { onSaveCompany: undefined });
    expect(screen.queryByRole('button', { name: /empresas \/ escolas/i })).not.toBeInTheDocument();
  });

  it('mostra quantos professores e usuários dependem da empresa', () => {
    renderView([user(), user({ id: 'u2', name: 'Outro', teacherId: 'prof-carlos', companyId: 'comp-1' })]);
    fireEvent.click(screen.getByRole('button', { name: /empresas \/ escolas/i }));
    expect(screen.getByText(/1 professor\(es\)/i)).toBeInTheDocument();
    expect(screen.getByText(/2 usuário\(s\)/i)).toBeInTheDocument();
  });

  it('cadastra uma empresa nova', () => {
    const { onSaveCompany } = renderView([]);
    fireEvent.click(screen.getByRole('button', { name: /empresas \/ escolas/i }));
    fireEvent.click(screen.getByRole('button', { name: /nova empresa/i }));

    fireEvent.change(screen.getByLabelText(/nome da empresa/i), { target: { value: 'Escola Nado Livre' } });
    fireEvent.change(screen.getByLabelText(/cnpj/i), { target: { value: '11.222.333/0001-44' } });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar empresa/i }));

    expect(onSaveCompany).toHaveBeenCalledTimes(1);
    expect(onSaveCompany.mock.calls[0][0]).toMatchObject({
      name: 'Escola Nado Livre',
      document: '11.222.333/0001-44',
      status: 'ativa',
    });
  });
});
