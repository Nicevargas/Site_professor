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
   * Gestor da empresa: painel somado da academia, e as telas de um professor
   * por vez através do seletor no topo. Sem 'site-admin', 'meu-endereco' nem
   * 'integracoes': essas são do professor sobre a vitrine dele.
   * 'pagamentos' entra só quando a empresa libera (ver canViewFinances).
   */
  gestor: ['dashboard', 'agenda', 'alunos', 'servicos', 'pagamentos', 'usuarios', 'configuracoes'],
  // Secretaria: agenda, alunos e consulta de serviços. Sem financeiro, site, integrações ou perfil do professor.
  assistente: ['dashboard', 'agenda', 'alunos', 'servicos'],
  // Aluno: portal próprio e edição dos próprios dados (nunca o perfil do professor).
  aluno: ['portal-aluno', 'configuracoes'],
};

const DEFAULT_VIEW_BY_ROLE: Record<UserRole, ViewMode> = {
  admin: 'dashboard',
  gestor: 'dashboard',
  professor: 'dashboard',
  assistente: 'dashboard',
  aluno: 'portal-aluno',
};

export function canAccessView(
  role: UserRole,
  view: ViewMode,
  options: { managerSeesFinance?: boolean } = {}
): boolean {
  if (PUBLIC_VIEWS.includes(view)) return true;
  // O financeiro do gestor depende da empresa dele, não do papel
  if (role === 'gestor' && view === 'pagamentos' && !options.managerSeesFinance) return false;
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
 * O gestor só enxerga quando a empresa dele libera. Isso é decidido no banco
 * (companies.manager_sees_finance); aqui só espelhamos, para não mostrar uma
 * tela que o RLS vai devolver vazia.
 */
export function canViewFinances(
  role: UserRole,
  options: { managerSeesFinance?: boolean } = {}
): boolean {
  if (role === 'admin' || role === 'professor') return true;
  return role === 'gestor' && Boolean(options.managerSeesFinance);
}

/** O gestor administra os professores da empresa dele. */
export function canManageCompany(role: UserRole): boolean {
  return role === 'admin' || role === 'gestor';
}

/**
 * Papel que uma pessoa pode declarar sobre si mesma (cadastro público ou metadata do Auth).
 * admin e assistente só podem ser atribuídos por um admin na tela de Usuários.
 */
export function sanitizeSelfDeclaredRole(value: unknown): UserRole {
  return value === 'aluno' ? 'aluno' : 'professor';
}
