import { SiteAdminTab, ViewMode } from '../types';

/**
 * Rotas na URL (hash) e títulos das telas.
 * Ex.: #/agenda abre a Agenda; o botão voltar do navegador funciona entre telas.
 */
/**
 * '/' de propósito NÃO pertence a nenhuma tela.
 *
 * A raiz significa "sem rota escolhida", e quem decide o destino é o papel
 * de quem chega: visitante vê a vitrine, quem está logado vai para o painel.
 * Enquanto '/' apontava para a vitrine, bastava o profissional abrir o
 * próprio site uma vez para toda visita seguinte cair lá -- e parecer que a
 * sessão tinha expirado.
 */
const HASH_BY_VIEW: Record<ViewMode, string> = {
  plataforma: '/conheca',
  'public-landing': '/site',
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
  'meu-endereco': '/meu-endereco',
  integracoes: '/integracoes',
  configuracoes: '/configuracoes',
  'tutorial-wizard': '/tutorial',
};

export const VIEW_TITLES: Record<ViewMode, string> = {
  plataforma: 'Conheça o Aquagenda',
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
  'meu-endereco': 'Meu endereço',
  integracoes: 'Automações',
  configuracoes: 'Configurações',
  'tutorial-wizard': 'Tutorial',
};

export const SITE_ADMIN_SECTIONS: { id: SiteAdminTab; label: string }[] = [
  { id: 'branding', label: 'Identidade e cores' },
  { id: 'menu', label: 'Seções do site' },
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
