/**
 * Testes da automação de novidades. Rodar com:
 *   node --test automacoes/n8n/
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

test('lê texto e imagem das novidades reais do projeto', () => {
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

test('monta os campos do nó "Enviar Imagem" com o texto na legenda', () => {
  const envio = montarEnvio({
    destino: '120363000000000000@g.us',
    texto: '🆕 *Oi*',
    imagemUrl: urlBruta('Nicevargas/Site_professor', 'abc123', 'novidades/imagens/2026-09-20-x.png'),
    arquivoImagem: 'novidades/imagens/2026-09-20-x.png',
  });
  assert.equal(envio.remoteJid, '120363000000000000@g.us');
  assert.equal(envio.caption, '🆕 *Oi*');
  assert.equal(envio.media, 'https://raw.githubusercontent.com/Nicevargas/Site_professor/abc123/novidades/imagens/2026-09-20-x.png');
});

test('novidade sem imagem para com aviso, em vez de mandar pela metade', () => {
  assert.throws(() => montarEnvio({ destino: '5551999999999', texto: 'oi', imagemUrl: null }), /precisa de imagem/);
  assert.throws(() => montarEnvio({ destino: '', texto: 'oi', imagemUrl: 'https://x/y.png' }), /destino/);
});

test('o fluxo de publicar está em dia, usa o nó da Evolution e não leva chave', () => {
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

  const envio = fluxo.nodes.find((n) => n.name === 'Enviar pelo WhatsApp');
  assert.equal(envio.type, 'n8n-nodes-evolution-api.evolutionApi');
  assert.equal(envio.parameters.resource, 'messages-api');
  assert.equal(envio.parameters.operation, 'send-image');
  // Só campos que o nó mostra em "Enviar Imagem" (os outros o n8n descarta)
  assert.deepEqual(Object.keys(envio.parameters).sort(), ['caption', 'instanceName', 'media', 'operation', 'options_message', 'remoteJid', 'resource']);

  // Credencial só como referência (id e nome), nunca endereço ou chave
  for (const no of fluxo.nodes.filter((n) => n.credentials)) {
    assert.deepEqual(Object.keys(no.credentials.evolutionApi).sort(), ['id', 'name'], `nó "${no.name}" leva mais que a referência da credencial`);
  }
  assert.ok(!/apikey|server-url/i.test(depois), 'o JSON não pode ter chave nem endereço da Evolution');
});
