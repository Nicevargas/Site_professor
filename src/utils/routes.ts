import { SiteAdminTab, ViewMode } from '../types';

/**
 * Rotas na URL (hash) e títulos das telas.
 * Ex.: #/agenda abre a Agenda; o botão voltar do navegador funciona entre telas.
 */
const HASH_BY_VIEW: Record<ViewMode, string> = {
  'public-landing': '/',
  'public-booking': '/agendar',
  auth: '/entrar',
  dashboard: '/painel',
  agenda: '/agenda',
  servicos: '/servicos',
  alunos: '/alunos',
  pagamentos: '/financeiro',
  usuarios: '/usuarios',
  'portal-aluno': '/portal',
  'site-admin': '/meu-site',
  planos: '/planos',
  integracoes: '/integracoes',
  configuracoes: '/configuracoes',
  'tutorial-wizard': '/tutorial',
};

export const VIEW_TITLES: Record<ViewMode, string> = {
  'public-landing': 'Site público',
  'public-booking': 'Agendar aula',
  auth: 'Entrar',
  dashboard: 'Painel',
  agenda: 'Agenda',
  servicos: 'Serviços',
  alunos: 'Alunos',
  pagamentos: 'Financeiro',
  usuarios: 'Usuários e permissões',
  'portal-aluno': 'Portal do aluno',
  'site-admin': 'Meu site',
  planos: 'Planos',
  integracoes: 'Automações',
  configuracoes: 'Configurações',
  'tutorial-wizard': 'Tutorial',
};

export const SITE_ADMIN_SECTIONS: { id: SiteAdminTab; label: string }[] = [
  { id: 'branding', label: 'Identidade e cores' },
  { id: 'testimonials', label: 'Depoimentos' },
  { id: 'curriculum', label: 'Currículo' },
  { id: 'videos', label: 'Vídeos e podcasts' },
  { id: 'photos', label: 'Fotos' },
  { id: 'faqs', label: 'Perguntas frequentes' },
];

export function hashFromView(view: ViewMode): string {
  return HASH_BY_VIEW[view] || '/';
}

export function viewFromHash(hash: string): ViewMode | null {
  const path = (hash || '').replace(/^#/, '').split('?')[0] || '';
  if (!path) return null;
  const entry = (Object.entries(HASH_BY_VIEW) as [ViewMode, string][]).find(([, p]) => p === path);
  return entry ? entry[0] : null;
}
