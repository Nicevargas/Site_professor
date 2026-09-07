import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vitest/config';

/**
 * robots.txt e sitemap.xml gerados a partir do host real.
 *
 * Antes eram arquivos fixos em public/, apontando para agendaprofessor.com.br
 * -- um domínio que não é da plataforma -- e o sitemap listava âncoras
 * (#servicos, #faq) da página do professor de demonstração. Buscador nenhum
 * trata âncora como página separada, então aquilo não indexava nada e ainda
 * mandava o robô para fora.
 *
 * O sitemap cobre só as páginas da plataforma. As vitrines dos professores
 * não cabem num arquivo estático: cada uma vive num endereço próprio, criado
 * no momento em que o professor assina, depois deste build ter acontecido.
 */
function seoEstatico(host: string) {
  const base = host ? `https://${host}` : '';
  const hoje = new Date().toISOString().slice(0, 10);

  const robots = [
    '# Aquagenda',
    'User-agent: *',
    'Allow: /',
    '',
    '# Telas de quem já é cliente: visita vinda da busca bate em porta fechada',
    'Disallow: /#/painel',
    'Disallow: /#/entrar',
    'Disallow: /#/financeiro',
    'Disallow: /#/alunos',
    'Disallow: /#/usuarios',
    'Disallow: /#/configuracoes',
    '',
    base
      ? `Sitemap: ${base}/sitemap.xml`
      : '# Sem VITE_PLATFORM_HOST não dá para escrever a linha Sitemap, que exige URL absoluta',
    '',
  ].join('\n');

  const paginas = base
    ? [
        { loc: `${base}/`, prioridade: '1.0', frequencia: 'weekly' },
        { loc: `${base}/#/conheca`, prioridade: '0.9', frequencia: 'monthly' },
      ]
    : [];

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paginas.map((p) =>
      [
        '  <url>',
        `    <loc>${p.loc}</loc>`,
        `    <lastmod>${hoje}</lastmod>`,
        `    <changefreq>${p.frequencia}</changefreq>`,
        `    <priority>${p.prioridade}</priority>`,
        '  </url>',
      ].join('\n')
    ),
    '</urlset>',
    '',
  ].join('\n');

  return {
    name: 'aquagenda-seo-estatico',
    generateBundle(this: { emitFile: (f: { type: 'asset'; fileName: string; source: string }) => void }) {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      seoEstatico((process.env.VITE_PLATFORM_HOST || '').trim().toLowerCase()),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    test: {
      // Testes unitários (src/**/*.test.ts) e de componente (src/**/*.test.tsx) com Vitest
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
    },
  };
});
