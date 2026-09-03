import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SideNav } from './SideNav';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { AuthUser, TeacherProfile, UserRole } from '../types';

const teacher: TeacherProfile = {
  id: 'prof-teste',
  name: 'Prof. Teste',
  role: 'Professor',
  specialty: 'Matemática',
  bio: '',
  rating: 5,
  reviewCount: 1,
  yearsExperience: 1,
  avatarUrl: 'https://example.com/a.png',
  heroImageUrl: '',
  whatsapp: '5511999999999',
  email: 'prof@teste.com',
};

function renderNav(role: UserRole, extra: Partial<React.ComponentProps<typeof SideNav>> = {}) {
  const user: AuthUser = { id: `u-${role}`, email: `${role}@teste.com`, name: `Usuário ${role}`, role };
  const onNavigate = vi.fn();
  render(
    <AccessibilityProvider>
      <SideNav
        currentView="dashboard"
        onNavigate={onNavigate}
        currentTeacher={teacher}
        currentUser={user}
        isOpen={false}
        onClose={() => {}}
        sidebarMode="pinned"
        onChangeSidebarMode={() => {}}
        {...extra}
      />
    </AccessibilityProvider>
  );
  return { onNavigate };
}

const menu = () => screen.getByRole('complementary', { name: /navegação principal/i });

describe('barra lateral por papel', () => {
  it('admin vê usuários, financeiro e site', () => {
    renderNav('admin');
    const nav = menu();
    expect(nav).toHaveTextContent('Usuários & Permissões');
    expect(nav).toHaveTextContent('Financeiro & Pix');
    expect(nav).toHaveTextContent('Meu Site & Conteúdo');
    expect(nav).toHaveTextContent('Ver meu site');
  });

  it('professor vê financeiro mas não gerencia usuários', () => {
    renderNav('professor');
    const nav = menu();
    expect(nav).toHaveTextContent('Meu Financeiro');
    expect(nav).not.toHaveTextContent('Usuários & Permissões');
  });

  it('secretaria não vê financeiro nem configurações', () => {
    renderNav('assistente');
    const nav = menu();
    expect(nav).toHaveTextContent('Agenda de Aulas');
    expect(nav).toHaveTextContent('Cadastro de Alunos');
    expect(nav).not.toHaveTextContent('Financeiro');
    expect(nav).not.toHaveTextContent('Configurações');
    expect(nav).not.toHaveTextContent('Meu Site');
  });

  it('aluno vê só portal, agendar, vitrine e meus dados', () => {
    renderNav('aluno');
    const nav = menu();
    expect(nav).toHaveTextContent('Meu Portal');
    expect(nav).toHaveTextContent('Agendar Nova Aula');
    expect(nav).toHaveTextContent('Meus Dados');
    expect(nav).not.toHaveTextContent('Financeiro');
    expect(nav).not.toHaveTextContent('Dashboard');
  });

  it('clicar em um item navega para a tela', () => {
    const { onNavigate } = renderNav('professor');
    // O item existe na barra lateral e na barra inferior do celular; qualquer um deve navegar
    const [sidebarItem] = screen.getAllByRole('button', { name: /minha agenda/i });
    fireEvent.click(sidebarItem);
    expect(onNavigate).toHaveBeenCalledWith('agenda');
  });

  it('botão Menu do celular abre o menu lateral', () => {
    const onOpen = vi.fn();
    renderNav('professor', { onOpen });
    fireEvent.click(screen.getByRole('button', { name: /^menu$/i }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('mostra sub-itens de Meu Site quando a tela está aberta', () => {
    const onSelectSiteAdminTab = vi.fn();
    renderNav('professor', { currentView: 'site-admin', siteAdminTab: 'branding', onSelectSiteAdminTab });
    fireEvent.click(screen.getByRole('button', { name: /^depoimentos$/i }));
    expect(onSelectSiteAdminTab).toHaveBeenCalledWith('testimonials');
  });
});
