import { describe, it, expect } from 'vitest';
import {
  canAccessView,
  getDefaultView,
  canSwitchProfiles,
  canViewFinances,
  sanitizeSelfDeclaredRole,
  canManageCompany,
} from './permissions';
import { UserRole, ViewMode } from '../types';

const ALL_ROLES: UserRole[] = ['admin', 'professor', 'assistente', 'aluno'];
const PUBLIC_VIEWS: ViewMode[] = ['public-landing', 'public-booking', 'auth', 'tutorial-wizard'];

describe('governança de acesso por papel', () => {
  it('telas públicas ficam abertas para todos os papéis', () => {
    for (const role of ALL_ROLES) {
      for (const view of PUBLIC_VIEWS) {
        expect(canAccessView(role, view)).toBe(true);
      }
    }
  });

  it('admin acessa todas as telas administrativas', () => {
    const adminViews: ViewMode[] = [
      'dashboard', 'agenda', 'servicos', 'alunos', 'pagamentos', 'usuarios',
      'site-admin', 'planos', 'integracoes', 'configuracoes',
    ];
    for (const view of adminViews) expect(canAccessView('admin', view)).toBe(true);
  });

  it('professor não gerencia usuários da plataforma', () => {
    expect(canAccessView('professor', 'usuarios')).toBe(false);
    expect(canAccessView('professor', 'pagamentos')).toBe(true);
    expect(canAccessView('professor', 'site-admin')).toBe(true);
    expect(canAccessView('professor', 'configuracoes')).toBe(true);
  });

  it('secretaria fica restrita a agenda, alunos e serviços', () => {
    expect(canAccessView('assistente', 'agenda')).toBe(true);
    expect(canAccessView('assistente', 'alunos')).toBe(true);
    expect(canAccessView('assistente', 'servicos')).toBe(true);
    expect(canAccessView('assistente', 'pagamentos')).toBe(false);
    expect(canAccessView('assistente', 'configuracoes')).toBe(false);
    expect(canAccessView('assistente', 'site-admin')).toBe(false);
    expect(canAccessView('assistente', 'integracoes')).toBe(false);
    expect(canAccessView('assistente', 'usuarios')).toBe(false);
  });

  it('aluno só abre o portal e os próprios dados', () => {
    expect(canAccessView('aluno', 'portal-aluno')).toBe(true);
    expect(canAccessView('aluno', 'configuracoes')).toBe(true);
    for (const view of ['dashboard', 'agenda', 'pagamentos', 'usuarios', 'site-admin', 'integracoes'] as ViewMode[]) {
      expect(canAccessView('aluno', view)).toBe(false);
    }
  });

  it('tela padrão depende do papel', () => {
    expect(getDefaultView('aluno')).toBe('portal-aluno');
    expect(getDefaultView('admin')).toBe('dashboard');
    expect(getDefaultView('professor')).toBe('dashboard');
    expect(getDefaultView('assistente')).toBe('dashboard');
  });

  it('somente admin assume outro perfil', () => {
    expect(canSwitchProfiles('admin')).toBe(true);
    expect(canSwitchProfiles('professor')).toBe(false);
    expect(canSwitchProfiles('assistente')).toBe(false);
    expect(canSwitchProfiles('aluno')).toBe(false);
  });

  it('financeiro é do dono do tenant ou do admin', () => {
    expect(canViewFinances('admin')).toBe(true);
    expect(canViewFinances('professor')).toBe(true);
    expect(canViewFinances('assistente')).toBe(false);
    expect(canViewFinances('aluno')).toBe(false);
  });

  it('papel autodeclarado nunca vira admin ou secretaria', () => {
    expect(sanitizeSelfDeclaredRole('admin')).toBe('professor');
    expect(sanitizeSelfDeclaredRole('assistente')).toBe('professor');
    expect(sanitizeSelfDeclaredRole('aluno')).toBe('aluno');
    expect(sanitizeSelfDeclaredRole('professor')).toBe('professor');
    expect(sanitizeSelfDeclaredRole(undefined)).toBe('professor');
    expect(sanitizeSelfDeclaredRole({ role: 'admin' })).toBe('professor');
  });
});

describe('gestor da empresa', () => {
  it('opera a academia: painel, agenda, alunos, serviços e usuários', () => {
    expect(canAccessView('gestor', 'dashboard')).toBe(true);
    expect(canAccessView('gestor', 'agenda')).toBe(true);
    expect(canAccessView('gestor', 'alunos')).toBe(true);
    expect(canAccessView('gestor', 'servicos')).toBe(true);
    expect(canAccessView('gestor', 'usuarios')).toBe(true);
    expect(getDefaultView('gestor')).toBe('dashboard');
  });

  it('não mexe na vitrine nem no endereço do professor', () => {
    // Marca, domínio e automações são do professor sobre o site dele
    expect(canAccessView('gestor', 'site-admin')).toBe(false);
    expect(canAccessView('gestor', 'meu-endereco')).toBe(false);
    expect(canAccessView('gestor', 'integracoes')).toBe(false);
  });

  it('o financeiro depende da empresa liberar, não do papel', () => {
    expect(canViewFinances('gestor')).toBe(false);
    expect(canViewFinances('gestor', { managerSeesFinance: true })).toBe(true);

    expect(canAccessView('gestor', 'pagamentos')).toBe(false);
    expect(canAccessView('gestor', 'pagamentos', { managerSeesFinance: true })).toBe(true);
  });

  it('a liberação da empresa não afeta os outros papéis', () => {
    // Professor sempre vê o próprio financeiro; assistente e aluno, nunca
    expect(canViewFinances('professor')).toBe(true);
    expect(canViewFinances('assistente', { managerSeesFinance: true })).toBe(false);
    expect(canViewFinances('aluno', { managerSeesFinance: true })).toBe(false);
    expect(canAccessView('assistente', 'pagamentos', { managerSeesFinance: true })).toBe(false);
  });

  it('gestor administra empresa; professor e assistente, não', () => {
    expect(canManageCompany('gestor')).toBe(true);
    expect(canManageCompany('admin')).toBe(true);
    expect(canManageCompany('professor')).toBe(false);
    expect(canManageCompany('assistente')).toBe(false);
  });

  it('não assume outro perfil: simular acesso é só do admin', () => {
    expect(canSwitchProfiles('gestor')).toBe(false);
  });

  it('ninguém se cadastra como gestor sozinho', () => {
    expect(sanitizeSelfDeclaredRole('gestor')).toBe('professor');
    expect(sanitizeSelfDeclaredRole('admin')).toBe('professor');
  });
});
