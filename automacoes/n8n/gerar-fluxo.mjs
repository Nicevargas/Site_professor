#!/usr/bin/env node
/**
 * Gera os fluxos para importar no n8n a partir das regras testadas:
 *   - publicar-novidades-whatsapp.json  (novidade.mjs)
 *   - descobrir-id-do-grupo.json        (grupos.mjs)
 *
 * Rodar sempre que mexer nas regras:
 *   node automacoes/n8n/gerar-fluxo.mjs
 *
 * Os envios usam o nó da comunidade "Evolution API" (n8n-nodes-evolution-api)
 * com a credencial que a Nice já tem no n8n. O JSON leva só a REFERÊNCIA a
 * essa credencial (id e nome), nunca o endereço nem a chave da Evolution.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));

/** Credencial "Evolution API" já cadastrada no n8n da Nice (só a referência). */
const CREDENCIAL_EVOLUTION = { evolutionApi: { id: 'tuxjQsSXPeXTu0NS', name: 'podcast' } };
const INSTANCIA_PADRAO = 'podcast';
const NO_EVOLUTION = { type: 'n8n-nodes-evolution-api.evolutionApi', typeVersion: 1 };

/** Funções de um arquivo de regras, sem "export": o nó de código do n8n não usa módulos. */
function funcoesDe(arquivo) {
  return readFileSync(join(aqui, arquivo), 'utf8').replace(/\r\n/g, '\n').replace(/^export /gm, '').trim();
}

function atribuicoes(prefixo, campos) {
  return {
    assignments: campos.map(([name, value, type = 'string'], i) => ({
      id: `${prefixo}-${String(100 + i).padStart(12, '0')}`,
      name,
      value,
      type,
    })),
  };
}

function gravar(nomeArquivo, fluxo) {
  writeFileSync(join(aqui, nomeArquivo), JSON.stringify(fluxo, null, 2) + '\n');
  console.log(`✓ automacoes/n8n/${nomeArquivo} gerado`);
}

// ============================================================================
// Fluxo 1: publicar novidades no grupo
// ============================================================================
const regrasNovidade = funcoesDe('novidade.mjs');
const passo = (corpo) => `${regrasNovidade}\n\n// ---------------- passo do fluxo ----------------\n${corpo.trim()}\n`;

const separarNovidades = passo(`
const config = $('Configuração').first().json;

// Botão "Testar com meu número": manda a novidade de teste só para você
if (!$('GitHub avisa').isExecuted) {
  return [{ json: { caminho: config.arquivoTeste, commit: config.branch, destino: String(config.numeroTeste), modo: 'teste', esperaSegundos: 1 } }];
}

const aviso = $('GitHub avisa').first().json;
const evento = (aviso.headers || {})['x-github-event'];
if (evento !== 'push') return [];

const jaPublicadas = $getWorkflowStaticData('global').publicadas || [];
return novidadesDoPush(aviso.body, config)
  .filter((n) => !jaPublicadas.includes(n.caminho))
  .map((n) => ({ json: { ...n, destino: config.grupoJid, modo: 'grupo', esperaSegundos: Math.max(1, Number(config.esperaMinutos || 3) * 60) } }));
`);

const montarMensagem = passo(`
const config = $('Configuração').first().json;
const markdown = await this.helpers.httpRequest({
  method: 'GET',
  url: urlBruta(config.repositorio, $json.commit, $json.caminho),
  json: false,
});
const { texto, imagem } = extrairMensagem(String(markdown), $json.caminho);
const envio = montarEnvio({
  destino: $json.destino,
  texto,
  imagemUrl: imagem ? urlBruta(config.repositorio, $json.commit, imagem) : null,
  arquivoImagem: imagem,
});
return { json: { ...$json, ...envio } };
`);

const marcarPublicada = `
// Só chega aqui se o envio deu certo: o nó da Evolution para o fluxo quando falha
const item = $('Montar mensagem').item.json;
if (item.modo !== 'grupo') return { json: { teste: true, enviado: item.caminho } };
const dados = $getWorkflowStaticData('global');
dados.publicadas = [...new Set([...(dados.publicadas || []), item.caminho])].slice(-500);
return { json: { publicada: item.caminho } };
`.trim() + '\n';

gravar('publicar-novidades-whatsapp.json', {
  name: 'Aquagenda: publicar novidades no grupo do WhatsApp',
  nodes: [
    {
      parameters: { httpMethod: 'POST', path: 'aquagenda-novidades-TROQUE-ESTE-FINAL', responseMode: 'onReceived', options: {} },
      id: '5a1d0a3e-0001-4a6e-9c1b-000000000001',
      name: 'GitHub avisa',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [0, 0],
      webhookId: '5a1d0a3e-0001-4a6e-9c1b-0000000000aa',
    },
    {
      parameters: {},
      id: '5a1d0a3e-0002-4a6e-9c1b-000000000002',
      name: 'Testar com meu número',
      type: 'n8n-nodes-base.manualTrigger',
      typeVersion: 1,
      position: [0, 220],
    },
    {
      parameters: {
        mode: 'manual',
        assignments: atribuicoes('5a1d0a3e-0003-4a6e-9c1b', [
          ['instancia', INSTANCIA_PADRAO],
          ['grupoJid', '120363000000000000@g.us'],
          ['numeroTeste', '5551999999999'],
          ['arquivoTeste', 'novidades/2026-09-15-domingo-e-aula-gratuita.md'],
          ['repositorio', 'Nicevargas/Site_professor'],
          ['branch', 'main'],
          ['esperaMinutos', 3, 'number'],
        ]),
        includeOtherFields: false,
        options: {},
      },
      id: '5a1d0a3e-0003-4a6e-9c1b-000000000003',
      name: 'Configuração',
      type: 'n8n-nodes-base.set',
      typeVersion: 3.4,
      position: [240, 100],
    },
    {
      parameters: { jsCode: separarNovidades },
      id: '5a1d0a3e-0004-4a6e-9c1b-000000000004',
      name: 'Separar novidades',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [480, 100],
    },
    {
      parameters: { amount: '={{ $json.esperaSegundos }}', unit: 'seconds' },
      id: '5a1d0a3e-0005-4a6e-9c1b-000000000005',
      name: 'Esperar o site publicar',
      type: 'n8n-nodes-base.wait',
      typeVersion: 1.1,
      position: [720, 100],
      webhookId: '5a1d0a3e-0005-4a6e-9c1b-0000000000bb',
    },
    {
      parameters: { mode: 'runOnceForEachItem', jsCode: montarMensagem },
      id: '5a1d0a3e-0006-4a6e-9c1b-000000000006',
      name: 'Montar mensagem',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [960, 100],
    },
    {
      // Só os campos que o nó mostra em "Enviar Imagem"; tipo e nome do arquivo ficam no padrão do nó
      parameters: {
        resource: 'messages-api',
        operation: 'send-image',
        instanceName: "={{ $('Configuração').first().json.instancia }}",
        remoteJid: '={{ $json.remoteJid }}',
        media: '={{ $json.media }}',
        caption: '={{ $json.caption }}',
        options_message: {},
      },
      id: '5a1d0a3e-0007-4a6e-9c1b-000000000007',
      name: 'Enviar pelo WhatsApp',
      ...NO_EVOLUTION,
      position: [1200, 100],
      credentials: CREDENCIAL_EVOLUTION,
      retryOnFail: true,
      maxTries: 3,
      waitBetweenTries: 5000,
    },
    {
      parameters: { mode: 'runOnceForEachItem', jsCode: marcarPublicada },
      id: '5a1d0a3e-0008-4a6e-9c1b-000000000008',
      name: 'Marcar como publicada',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1440, 100],
    },
  ],
  connections: {
    'GitHub avisa': { main: [[{ node: 'Configuração', type: 'main', index: 0 }]] },
    'Testar com meu número': { main: [[{ node: 'Configuração', type: 'main', index: 0 }]] },
    Configuração: { main: [[{ node: 'Separar novidades', type: 'main', index: 0 }]] },
    'Separar novidades': { main: [[{ node: 'Esperar o site publicar', type: 'main', index: 0 }]] },
    'Esperar o site publicar': { main: [[{ node: 'Montar mensagem', type: 'main', index: 0 }]] },
    'Montar mensagem': { main: [[{ node: 'Enviar pelo WhatsApp', type: 'main', index: 0 }]] },
    'Enviar pelo WhatsApp': { main: [[{ node: 'Marcar como publicada', type: 'main', index: 0 }]] },
  },
  settings: { executionOrder: 'v1' },
  pinData: {},
});

// ============================================================================
// Fluxo 2: descobrir o ID do grupo (para preencher grupoJid)
// ============================================================================
const nomeEId = `${funcoesDe('grupos.mjs')}

// ---------------- passo do fluxo ----------------
const config = $('Configuração').first().json;
const lista = listarGrupos($input.all().map((i) => i.json), config.buscarNome);
if (!lista.length) {
  return [{
    json: {
      aviso: config.buscarNome
        ? \`Nenhum grupo com "\${config.buscarNome}" no nome. Apague o buscarNome na Configuração e rode de novo.\`
        : 'Nenhum grupo encontrado. Confira se a instância está conectada ao WhatsApp que participa do grupo.',
    },
  }];
}
return lista.map((g) => ({ json: g }));
`;

gravar('descobrir-id-do-grupo.json', {
  name: 'Aquagenda: descobrir ID do grupo do WhatsApp',
  nodes: [
    {
      parameters: {},
      id: '6b2e1b4f-0001-4b7f-8d2c-000000000001',
      name: 'Listar meus grupos',
      type: 'n8n-nodes-base.manualTrigger',
      typeVersion: 1,
      position: [0, 0],
    },
    {
      parameters: {
        mode: 'manual',
        assignments: atribuicoes('6b2e1b4f-0002-4b7f-8d2c', [
          ['instancia', INSTANCIA_PADRAO],
          ['buscarNome', ''],
        ]),
        includeOtherFields: false,
        options: {},
      },
      id: '6b2e1b4f-0002-4b7f-8d2c-000000000002',
      name: 'Configuração',
      type: 'n8n-nodes-base.set',
      typeVersion: 3.4,
      position: [240, 0],
    },
    {
      parameters: {
        resource: 'groups-api',
        operation: 'fetch-groups',
        instanceName: "={{ $('Configuração').first().json.instancia }}",
        searchMethod: 'fetchAll',
        getParticipants: false,
      },
      id: '6b2e1b4f-0003-4b7f-8d2c-000000000003',
      name: 'Buscar grupos na Evolution',
      ...NO_EVOLUTION,
      position: [480, 0],
      credentials: CREDENCIAL_EVOLUTION,
    },
    {
      parameters: { jsCode: nomeEId },
      id: '6b2e1b4f-0004-4b7f-8d2c-000000000004',
      name: 'Nome e ID de cada grupo',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [720, 0],
    },
  ],
  connections: {
    'Listar meus grupos': { main: [[{ node: 'Configuração', type: 'main', index: 0 }]] },
    Configuração: { main: [[{ node: 'Buscar grupos na Evolution', type: 'main', index: 0 }]] },
    'Buscar grupos na Evolution': { main: [[{ node: 'Nome e ID de cada grupo', type: 'main', index: 0 }]] },
  },
  settings: { executionOrder: 'v1' },
  pinData: {},
});
