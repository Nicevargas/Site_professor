/**
 * Testes da automação de novidades. Rodar com:
 *   node --test automacoes/n8n/novidade.teste.mjs
 *
 * O nome é ".teste.mjs" (e não ".test.") de propósito: estes testes usam o
 * executor do próprio Node, e o vitest do site não deve tentar rodá-los.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extrairMensagem, montarEnvio, novidadesDoPush, urlBruta } from './novidade.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, '..', '..');
const config = { repositorio: 'Nicevargas/Site_professor', branch: 'main' };

function push(commits, extra = {}) {
  return {
    ref: 'refs/heads/main',
    after: 'abc123',
    repository: { full_name: 'Nicevargas/Site_professor' },
    commits,
    ...extra,
  };
}

test('pega só novidades novas, na ordem da data', () => {
  const corpo = push([
    { added: ['src/App.tsx', 'novidades/2026-09-20-b.md', 'novidades/imagens/2026-09-20-b.png'], removed: [] },
    { added: ['novidades/2026-09-18-a.md', 'novidades/README.md'], removed: [] },
  ]);
  assert.deepEqual(novidadesDoPush(corpo, config), [
    { caminho: 'novidades/2026-09-18-a.md', commit: 'abc123' },
    { caminho: 'novidades/2026-09-20-b.md', commit: 'abc123' },
  ]);
});

test('editar novidade antiga não publica de novo', () => {
  const corpo = push([{ added: [], modified: ['novidades/2026-09-14-horarios-de-aula.md'], removed: [] }]);
  assert.deepEqual(novidadesDoPush(corpo, config), []);
});

test('novidade adicionada e apagada no mesmo push não publica', () => {
  const corpo = push([
    { added: ['novidades/2026-09-20-rascunho.md'], removed: [] },
    { added: [], removed: ['novidades/2026-09-20-rascunho.md'] },
  ]);
  assert.deepEqual(novidadesDoPush(corpo, config), []);
});

test('outra branch, outro repositório ou ping do GitHub não publicam nada', () => {
  const commits = [{ added: ['novidades/2026-09-20-a.md'], removed: [] }];
  assert.deepEqual(novidadesDoPush(push(commits, { ref: 'refs/heads/teste' }), config), []);
  assert.deepEqual(novidadesDoPush(push(commits, { repository: { full_name: 'outra/coisa' } }), config), []);
  assert.deepEqual(novidadesDoPush({ zen: 'Keep it logically awesome.', hook_id: 1 }, config), []);
});

test('lê texto e imagem das três novidades reais do projeto', () => {
  const arquivos = readdirSync(join(raiz, 'novidades')).filter((f) => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(f));
  assert.ok(arquivos.length >= 3, 'esperava ao menos 3 novidades');
  for (const arquivo of arquivos) {
    const caminho = `novidades/${arquivo}`;
    const { texto, imagem } = extrairMensagem(readFileSync(join(raiz, caminho), 'utf8'), caminho);
    assert.match(texto, /^\S/, `${arquivo}: texto começa com espaço`);
    assert.ok(!texto.includes('## '), `${arquivo}: texto engoliu outra seção`);
    assert.ok(texto.includes('*'), `${arquivo}: sem negrito do WhatsApp`);
    assert.match(imagem, /^novidades\/imagens\/.+\.png$/);
    // A imagem citada existe de verdade no projeto
    readFileSync(join(raiz, imagem));
  }
});

test('texto comprido demais para legenda é recusado com aviso claro', () => {
  const md = `# X\n## Texto para o WhatsApp (copiar a partir daqui)\n${'a'.repeat(1001)}\n## Imagem\nimagens/x.png: y`;
  assert.throws(() => extrairMensagem(md, 'novidades/2026-09-20-x.md'), /1001 caracteres/);
});

test('novidade sem a seção de texto é recusada', () => {
  assert.throws(() => extrairMensagem('# Só título', 'novidades/2026-09-20-x.md'), /Texto para o WhatsApp/);
});

test('com imagem, pede sendMedia com o texto na legenda', () => {
  const envio = montarEnvio({
    destino: '120363000000000000@g.us',
    texto: '🆕 *Oi*',
    imagemUrl: urlBruta('Nicevargas/Site_professor', 'abc123', 'novidades/imagens/2026-09-20-x.png'),
    arquivoImagem: 'novidades/imagens/2026-09-20-x.png',
  });
  assert.equal(envio.rota, 'sendMedia');
  assert.deepEqual(envio.corpoEnvio, {
    number: '120363000000000000@g.us',
    mediatype: 'image',
    mimetype: 'image/png',
    caption: '🆕 *Oi*',
    media: 'https://raw.githubusercontent.com/Nicevargas/Site_professor/abc123/novidades/imagens/2026-09-20-x.png',
    fileName: '2026-09-20-x.png',
  });
});

test('sem imagem, pede sendText', () => {
  assert.deepEqual(montarEnvio({ destino: '5551999999999', texto: 'oi', imagemUrl: null }), {
    rota: 'sendText',
    corpoEnvio: { number: '5551999999999', text: 'oi' },
  });
});

test('o fluxo do n8n está em dia com este código e os nós de código são JavaScript válido', () => {
  const caminhoFluxo = join(aqui, 'publicar-novidades-whatsapp.json');
  // No Windows o Git pode trocar o fim de linha ao baixar: isso não é desatualização
  const lerSemFimDeLinha = () => readFileSync(caminhoFluxo, 'utf8').replace(/\r\n/g, '\n');
  const antes = lerSemFimDeLinha();
  execFileSync(process.execPath, [join(aqui, 'gerar-fluxo.mjs')]);
  const depois = lerSemFimDeLinha();
  assert.equal(depois, antes, 'o JSON estava desatualizado: rode node automacoes/n8n/gerar-fluxo.mjs e faça commit');

  const fluxo = JSON.parse(depois);
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  for (const no of fluxo.nodes.filter((n) => n.type === 'n8n-nodes-base.code')) {
    assert.doesNotThrow(() => new AsyncFunction('$', '$json', '$getWorkflowStaticData', no.parameters.jsCode), `nó "${no.name}" com erro de sintaxe`);
  }
  // Nenhuma chave ou segredo dentro do arquivo
  assert.ok(!/apikey"\s*:\s*"[A-Za-z0-9]{16,}/i.test(depois), 'o JSON não pode ter chave de API');
});
