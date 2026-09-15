#!/usr/bin/env node
/**
 * Gera publicar-novidades-whatsapp.json (o fluxo para importar no n8n) a
 * partir de novidade.mjs. Assim o código que roda no n8n é o mesmo que os
 * testes conferem. Rodar sempre que mexer em novidade.mjs:
 *   node automacoes/n8n/gerar-fluxo.mjs
 *
 * O arquivo gerado NÃO leva chave nem senha: a chave da Evolution fica numa
 * credencial do n8n, e os endereços no nó "Configuração", preenchidos lá.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));

// As funções de novidade.mjs sem "export": o nó de código do n8n não usa módulos
const funcoes = readFileSync(join(aqui, 'novidade.mjs'), 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/^export /gm, '')
  .trim();

const codigo = (corpo) => `${funcoes}\n\n// ---------------- passo do fluxo ----------------\n${corpo.trim()}\n`;

const separarNovidades = codigo(`
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

const montarMensagem = codigo(`
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
// Guarda o que já foi para o grupo: se o GitHub avisar de novo, não repete
const item = $('Montar mensagem').item.json;
if (item.modo !== 'grupo') return { json: { teste: true, enviado: item.caminho } };
const dados = $getWorkflowStaticData('global');
dados.publicadas = [...new Set([...(dados.publicadas || []), item.caminho])].slice(-500);
return { json: { publicada: item.caminho } };
`.trim() + '\n';

const configuracao = [
  ['evolutionUrl', 'https://evolution.seu-dominio.com.br', 'string'],
  ['instancia', 'NOME-DA-INSTANCIA', 'string'],
  ['grupoJid', '120363000000000000@g.us', 'string'],
  ['numeroTeste', '5551999999999', 'string'],
  ['arquivoTeste', 'novidades/2026-09-15-domingo-e-aula-gratuita.md', 'string'],
  ['repositorio', 'Nicevargas/Site_professor', 'string'],
  ['branch', 'main', 'string'],
  ['esperaMinutos', 3, 'number'],
];

const fluxo = {
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
        assignments: {
          assignments: configuracao.map(([name, value, type], i) => ({
            id: `5a1d0a3e-0003-4a6e-9c1b-${String(100 + i).padStart(12, '0')}`,
            name,
            value,
            type,
          })),
        },
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
      parameters: {
        method: 'POST',
        url: "={{ $('Configuração').first().json.evolutionUrl.replace(/\\/+$/, '') }}/message/{{ $json.rota }}/{{ $('Configuração').first().json.instancia }}",
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ JSON.stringify($json.corpoEnvio) }}',
        options: {},
      },
      id: '5a1d0a3e-0007-4a6e-9c1b-000000000007',
      name: 'Enviar pelo WhatsApp',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1200, 100],
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
};

writeFileSync(join(aqui, 'publicar-novidades-whatsapp.json'), JSON.stringify(fluxo, null, 2) + '\n');
console.log('✓ automacoes/n8n/publicar-novidades-whatsapp.json gerado');

// ============================================================================
// Fluxo 2: descobrir o ID do grupo (para preencher grupoJid)
// ============================================================================
const funcoesGrupos = readFileSync(join(aqui, 'grupos.mjs'), 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/^export /gm, '')
  .trim();

const nomeEId = `${funcoesGrupos}

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

const fluxoGrupos = {
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
        assignments: {
          assignments: [
            ['evolutionUrl', 'https://evolution.seu-dominio.com.br'],
            ['instancia', 'NOME-DA-INSTANCIA'],
            ['buscarNome', ''],
          ].map(([name, value], i) => ({
            id: `6b2e1b4f-0002-4b7f-8d2c-${String(100 + i).padStart(12, '0')}`,
            name,
            value,
            type: 'string',
          })),
        },
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
        method: 'GET',
        url: "={{ $('Configuração').first().json.evolutionUrl.replace(/\\/+$/, '') }}/group/fetchAllGroups/{{ $('Configuração').first().json.instancia }}",
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendQuery: true,
        queryParameters: { parameters: [{ name: 'getParticipants', value: 'false' }] },
        options: {},
      },
      id: '6b2e1b4f-0003-4b7f-8d2c-000000000003',
      name: 'Buscar grupos na Evolution',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [480, 0],
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
};

writeFileSync(join(aqui, 'descobrir-id-do-grupo.json'), JSON.stringify(fluxoGrupos, null, 2) + '\n');
console.log('✓ automacoes/n8n/descobrir-id-do-grupo.json gerado');
