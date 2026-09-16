/**
 * Testes do aviso de novidade para o WhatsApp. Rodar com:
 *   node --test automacoes/whatsapp/aviso.teste.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ORIGEM_DAS_IMAGENS,
  PAGINA_DE_ENVIO,
  avisoDaNovidade,
  linkParaEnviar,
  novidadesDaLista,
  tituloDaNovidade,
} from './aviso.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, '..', '..');
const repositorio = 'Nicevargas/Site_professor';
const commit = 'abc1234def5678';

const exemplo = `# Aula de domingo certa
Data: 2026-09-15 · Commit: bbc2d39 · Para: professores

## Texto para o WhatsApp (copiar a partir daqui)
📅 *Aquagenda: agenda mais certinha*

Aula de domingo & aula gratuita = certo. 100% #ok?

## Imagem
imagens/2026-09-15-domingo.png: janela de agendamento
`;

test('só entram arquivos de novidade, em ordem e sem repetir', () => {
  assert.deepEqual(
    novidadesDaLista(['novidades/README.md', 'src/app.ts', 'novidades/2026-09-15-b.md', 'novidades/2026-09-14-a.md', 'novidades/2026-09-15-b.md', '']),
    ['novidades/2026-09-14-a.md', 'novidades/2026-09-15-b.md']
  );
  assert.deepEqual(novidadesDaLista(['novidades/imagens/2026-09-15-b.png', 'novidades/rascunho.md']), []);
});

test('link leva texto e imagem intactos depois do #', () => {
  const imagemUrl = `${ORIGEM_DAS_IMAGENS}${commit}/novidades/imagens/x.png`;
  const texto = 'Linha 1 & *negrito*\n\nLinha 2 com # e ? e 100%';
  const link = linkParaEnviar({ texto, imagemUrl });
  assert.ok(link.startsWith(`${PAGINA_DE_ENVIO}#`));
  const params = new URLSearchParams(link.split('#')[1]);
  assert.equal(params.get('texto'), texto);
  assert.equal(params.get('imagem'), imagemUrl);
});

test('link recusa imagem de fora do repositório', () => {
  assert.throws(() => linkParaEnviar({ texto: 'oi', imagemUrl: 'https://exemplo.com/x.png' }), /precisa vir de/);
  assert.throws(() => linkParaEnviar({ texto: '', imagemUrl: `${ORIGEM_DAS_IMAGENS}x.png` }), /falta o texto/);
});

test('aviso tem título, link, texto citado e imagem travada no commit', () => {
  const aviso = avisoDaNovidade({ markdown: exemplo, caminho: 'novidades/2026-09-15-domingo.md', repositorio, commit });
  assert.equal(aviso.titulo, '📣 Enviar no grupo: Aula de domingo certa');
  assert.equal(aviso.imagem, 'novidades/imagens/2026-09-15-domingo.png');
  assert.equal(aviso.imagemUrl, `https://raw.githubusercontent.com/${repositorio}/${commit}/novidades/imagens/2026-09-15-domingo.png`);
  assert.ok(aviso.corpo.includes(`](${aviso.link})`));
  assert.ok(aviso.corpo.includes('> 📅 *Aquagenda: agenda mais certinha*'));
  assert.ok(aviso.corpo.includes(`![Aula de domingo certa](${aviso.imagemUrl})`));
});

test('novidade sem imagem não gera aviso pela metade', () => {
  const semImagem = exemplo.replace(/## Imagem[\s\S]*/, '');
  assert.throws(
    () => avisoDaNovidade({ markdown: semImagem, caminho: 'novidades/2026-09-15-x.md', repositorio, commit }),
    /precisa de imagem/
  );
});

test('título cai no nome do arquivo quando falta "# "', () => {
  assert.equal(tituloDaNovidade('sem título', 'novidades/2026-09-15-aula.md'), '2026-09-15-aula');
});

test('todas as novidades publicadas geram aviso válido, com a imagem no repositório', () => {
  const pasta = join(raiz, 'novidades');
  const arquivos = novidadesDaLista(readdirSync(pasta).map((f) => `novidades/${f}`));
  assert.ok(arquivos.length > 0);
  for (const caminho of arquivos) {
    const aviso = avisoDaNovidade({ markdown: readFileSync(join(raiz, caminho), 'utf8'), caminho, repositorio, commit });
    assert.ok(existsSync(join(raiz, aviso.imagem)), `${caminho}: falta ${aviso.imagem}`);
    // Links muito longos quebram em alguns apps de e-mail.
    assert.ok(aviso.link.length < 6000, `${caminho}: link com ${aviso.link.length} caracteres`);
  }
});
