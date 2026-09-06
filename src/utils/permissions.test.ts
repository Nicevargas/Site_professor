import { describe, it, expect } from 'vitest';
import {
  canAccessView,
  getDefaultView,
  canSwitchProfiles,
  canViewFinances,
  sanitizeSelfDeclaredRole,
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
  it('não alcança as telas de um professor específico enquanto não há seletor', () => {
    // Painel, agenda e alunos giram em torno de UM professor. Mostrá-los ao
    // gestor exibiria um professor arbitrário da academia -- Fase 3.
    expect(canAccessView('gestor', 'dashboard')).toBe(false);
    expect(canAccessView('gestor', 'agenda')).toBe(false);
    expect(canAccessView('gestor', 'alunos')).toBe(false);
  });

  it('alcança as telas que já funcionam certo para ele', () => {
    expect(canAccessView('gestor', 'usuarios')).toBe(true);
    expect(canAccessView('gestor', 'configuracoes')).toBe(true);
    expect(getDefaultView('gestor')).toBe('usuarios');
  });

  it('não vê financeiro pelo app: quem libera isso é a empresa, no banco', () => {
    expect(canViewFinances('gestor')).toBe(false);
  });

  it('não assume outro perfil: simular acesso é só do admin', () => {
    expect(canSwitchProfiles('gestor')).toBe(false);
  });

  it('ninguém se cadastra como gestor sozinho', () => {
    expect(sanitizeSelfDeclaredRole('gestor')).toBe('professor');
    expect(sanitizeSelfDeclaredRole('admin')).toBe('professor');
  });
});
