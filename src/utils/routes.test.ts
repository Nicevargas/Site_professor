import { describe, it, expect } from 'vitest';
import { hashFromView, viewFromHash, VIEW_TITLES, SITE_ADMIN_SECTIONS } from './routes';
import { ViewMode } from '../types';

const ALL_VIEWS: ViewMode[] = [
  'dashboard', 'agenda', 'servicos', 'alunos', 'pagamentos', 'usuarios', 'portal-aluno',
  'site-admin', 'planos', 'integracoes', 'public-landing', 'public-booking', 'configuracoes',
  'tutorial-wizard', 'auth',
];

describe('rotas na URL', () => {
  it('toda tela tem um caminho e volta para a mesma tela', () => {
    for (const view of ALL_VIEWS) {
      const path = hashFromView(view);
      expect(path.startsWith('/')).toBe(true);
      expect(viewFromHash(`#${path}`)).toBe(view);
    }
  });

  it('caminhos são únicos entre as telas', () => {
    const paths = ALL_VIEWS.map(hashFromView);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('aceita o hash com ou sem # e ignora query string', () => {
    expect(viewFromHash('/agenda')).toBe('agenda');
    expect(viewFromHash('#/agenda')).toBe('agenda');
    expect(viewFromHash('#/meu-site?aba=videos')).toBe('site-admin');
  });

  it('hash vazio ou desconhecido não vira tela', () => {
    expect(viewFromHash('')).toBeNull();
    expect(viewFromHash('#')).toBeNull();
    expect(viewFromHash('#/nao-existe')).toBeNull();
  });

  it('toda tela tem título para a barra superior', () => {
    for (const view of ALL_VIEWS) {
      expect(VIEW_TITLES[view]).toBeTruthy();
    }
  });

  it('seções de Meu Site cobrem as seis abas sem repetição', () => {
    const ids = SITE_ADMIN_SECTIONS.map((s) => s.id);
    expect(ids).toEqual(['branding', 'testimonials', 'curriculum', 'videos', 'photos', 'faqs']);
    expect(new Set(ids).size).toBe(6);
  });
});
