import { UserRole, ViewMode } from '../types';

/**
 * Governança de acesso do Aquagenda.
 * Papéis: admin (plataforma), professor (dono do tenant), assistente (secretaria do tenant), aluno (cliente).
 * A barra lateral apenas ESCONDE itens; quem decide se uma tela pode abrir é este módulo (usado pelo App).
 */

// Telas abertas a qualquer pessoa, logada ou não
const PUBLIC_VIEWS: ViewMode[] = ['public-landing', 'public-booking', 'auth', 'tutorial-wizard'];

const VIEWS_BY_ROLE: Record<UserRole, ViewMode[]> = {
  admin: [
    'dashboard', 'agenda', 'servicos', 'alunos', 'pagamentos', 'usuarios',
    'site-admin', 'meu-endereco', 'planos', 'integracoes', 'configuracoes',
  ],
  professor: [
    'dashboard', 'agenda', 'servicos', 'alunos', 'pagamentos',
    'site-admin', 'meu-endereco', 'planos', 'integracoes', 'configuracoes',
  ],
  /**
   * Gestor da empresa: por enquanto só as telas que já funcionam certo para
   * ele. Painel, agenda e alunos ainda são construídos em torno de UM
   * professor, então mostrá-los agora exibiria um professor arbitrário da
   * academia. Entram na Fase 3, junto com o seletor de professor.
   */
  gestor: ['usuarios', 'configuracoes'],
  // Secretaria: agenda, alunos e consulta de serviços. Sem financeiro, site, integrações ou perfil do professor.
  assistente: ['dashboard', 'agenda', 'alunos', 'servicos'],
  // Aluno: portal próprio e edição dos próprios dados (nunca o perfil do professor).
  aluno: ['portal-aluno', 'configuracoes'],
};

const DEFAULT_VIEW_BY_ROLE: Record<UserRole, ViewMode> = {
  admin: 'dashboard',
  gestor: 'usuarios',
  professor: 'dashboard',
  assistente: 'dashboard',
  aluno: 'portal-aluno',
};

export function canAccessView(role: UserRole, view: ViewMode): boolean {
  if (PUBLIC_VIEWS.includes(view)) return true;
  return VIEWS_BY_ROLE[role]?.includes(view) ?? false;
}

export function getDefaultView(role: UserRole): ViewMode {
  return DEFAULT_VIEW_BY_ROLE[role] || 'dashboard';
}

/** Somente admin pode assumir outro perfil (suporte / demonstração). */
export function canSwitchProfiles(role: UserRole): boolean {
  return role === 'admin';
}

/**
 * Financeiro e Pix pertencem ao dono do tenant ou ao admin.
 * O gestor só enxerga o financeiro quando a empresa dele libera
 * (companies.manager_sees_finance) -- e essa decisão é do banco, não daqui.
 * Até a Fase 3 trazer esse dado para o app, o gestor fica de fora.
 */
export function canViewFinances(role: UserRole): boolean {
  return role === 'admin' || role === 'professor';
}

/**
 * Papel que uma pessoa pode declarar sobre si mesma (cadastro público ou metadata do Auth).
 * admin e assistente só podem ser atribuídos por um admin na tela de Usuários.
 */
export function sanitizeSelfDeclaredRole(value: unknown): UserRole {
  return value === 'aluno' ? 'aluno' : 'professor';
}
