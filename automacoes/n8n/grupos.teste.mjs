/**
 * Testes do fluxo "descobrir o ID do grupo". Rodar com:
 *   node --test automacoes/n8n/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listarGrupos } from './grupos.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));

// Formato devolvido pela Evolution API em /group/fetchAllGroups
const grupos = [
  { id: '120363111111111111@g.us', subject: 'Professores Aquágenda', size: 42, announce: true, isCommunity: false },
  { id: '120363222222222222@g.us', subject: 'Família', size: 8, announce: false, isCommunity: false },
  { id: '120363333333333333@g.us', subject: 'Avisos da Academia', size: 120, announce: false, isCommunity: true },
  { id: '5551999999999@s.whatsapp.net', subject: 'Conversa comum, não é grupo' },
];

test('lista todos os grupos em ordem de nome, com o ID pronto para copiar', () => {
  const lista = listarGrupos(grupos, '');
  assert.deepEqual(lista.map((g) => g.grupo), ['Avisos da Academia', 'Família', 'Professores Aquágenda']);
  assert.ok(lista.every((g) => g.id.endsWith('@g.us')), 'só grupos, nunca conversa comum');
});

test('entende a resposta do nó da Evolution no n8n ({ success, data })', () => {
  const doNo = [{ success: true, data: grupos }];
  assert.equal(listarGrupos(doNo, '').length, 3);
});

test('busca pelo nome ignora maiúscula e acento', () => {
  assert.deepEqual(listarGrupos(grupos, 'AQUAGENDA'), [
    {
      grupo: 'Professores Aquágenda',
      id: '120363111111111111@g.us',
      participantes: 42,
      quemPodeEnviar: 'só administradores',
      comunidade: 'não',
    },
  ]);
  assert.equal(listarGrupos(grupos, 'familia')[0].id, '120363222222222222@g.us');
});

test('aceita a resposta como lista direta ou item a item', () => {
  assert.equal(listarGrupos(grupos.map((g) => g), null).length, 3);
  assert.equal(listarGrupos([[...grupos]], undefined).length, 3);
});

test('nenhum grupo com o nome buscado devolve lista vazia', () => {
  assert.deepEqual(listarGrupos(grupos, 'não existe'), []);
  assert.deepEqual(listarGrupos([{ success: true, data: [] }], ''), []);
});

test('o fluxo de grupos está em dia e usa o nó da Evolution para buscar todos', () => {
  const caminho = join(aqui, 'descobrir-id-do-grupo.json');
  const ler = () => readFileSync(caminho, 'utf8').replace(/\r\n/g, '\n');
  const antes = ler();
  execFileSync(process.execPath, [join(aqui, 'gerar-fluxo.mjs')]);
  const depois = ler();
  assert.equal(depois, antes, 'o JSON estava desatualizado: rode node automacoes/n8n/gerar-fluxo.mjs e faça commit');

  const fluxo = JSON.parse(depois);
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  for (const no of fluxo.nodes.filter((n) => n.type === 'n8n-nodes-base.code')) {
    assert.doesNotThrow(() => new AsyncFunction('$', '$input', no.parameters.jsCode), `nó "${no.name}" com erro de sintaxe`);
  }

  const busca = fluxo.nodes.find((n) => n.name === 'Buscar grupos na Evolution');
  assert.equal(busca.type, 'n8n-nodes-evolution-api.evolutionApi');
  assert.deepEqual(
    { resource: busca.parameters.resource, operation: busca.parameters.operation, searchMethod: busca.parameters.searchMethod, getParticipants: busca.parameters.getParticipants },
    { resource: 'groups-api', operation: 'fetch-groups', searchMethod: 'fetchAll', getParticipants: false }
  );
  assert.deepEqual(Object.keys(busca.credentials.evolutionApi).sort(), ['id', 'name']);
  assert.ok(!/apikey|server-url/i.test(depois), 'o JSON não pode ter chave nem endereço da Evolution');
});
