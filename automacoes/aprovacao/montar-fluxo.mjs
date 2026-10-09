/**
 * Monta o fluxo do n8n "Aquagenda - novidade com aprovação".
 *
 * Caminho de uma novidade:
 *   1. GitHub Actions avisa o n8n (POST /webhook/aquagenda-novidade, com token).
 *   2. O n8n guarda a novidade como PENDENTE e manda uma PRÉVIA para o próprio
 *      número da instância: a imagem com o texto, o link de aprovação e os
 *      anexos (mais imagens e vídeos), se houver.
 *   3. A Nice abre o link (GET /webhook/aquagenda-aprovar): vê a novidade e o
 *      botão "Enviar no grupo". Abrir o link não envia nada.
 *   4. Ao tocar no botão (POST no mesmo endereço), o n8n envia no grupo e
 *      marca como enviada, para nunca repetir.
 *
 * O repositório é público, então grupo e número NÃO ficam aqui: o arquivo
 * gerado traz __GRUPO__ e __NUMERO_PREVIA__, trocados só na hora de importar.
 *
 * Os textos dos nós de código ficam em `codigos`, e fluxo.teste.mjs roda
 * exatamente esses textos.
 */

export const PADRAO = {
  instancia: 'curtatche',
  grupo: '__GRUPO__',
  numeroPrevia: '__NUMERO_PREVIA__',
  baseN8n: 'https://n8n.curtatche.com.br',
  evolution: 'http://evolution-api:8080',
  nomeDoGrupo: 'AquAgenda',
  credencialEvolution: { id: 'evolutionApiKey1', name: 'Evolution API - apikey' },
  credencialToken: { id: 'aquagendaNovTok1', name: 'Aquagenda - token da novidade' },
};

/** Novidade pendente vale 7 dias; depois disso o link de aprovação expira. */
const VALIDADE_DIAS = 7;

export function codigos(cfg) {
  const config = `const CONFIG = ${JSON.stringify({
    grupo: cfg.grupo,
    numeroPrevia: cfg.numeroPrevia,
    linkAprovar: `${cfg.baseN8n}/webhook/aquagenda-aprovar`,
    nomeDoGrupo: cfg.nomeDoGrupo,
    validadeMs: VALIDADE_DIAS * 24 * 60 * 60 * 1000,
  })};`;

  const comum = `${config}
const escapar = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pagina = (titulo, corpo) => '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>' + escapar(titulo) + '</title><style>body{font-family:system-ui,sans-serif;background:#f7f9fb;color:#091426;margin:0;padding:24px}main{max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px}h1{font-size:20px;margin:0 0 12px}pre{white-space:pre-wrap;font:inherit;background:#f1f5f9;border-radius:12px;padding:12px;font-size:14px}img{max-width:100%;border-radius:12px;margin:12px 0}button{width:100%;padding:14px;border:0;border-radius:12px;background:#00687a;color:#fff;font-size:16px;font-weight:700}p{font-size:14px;color:#45474c}</style></head><body><main>' + corpo + '</main></body></html>';
// Anexos que seguem depois da imagem principal: mais imagens e vídeos
const TIPOS = { image: ['image/png', 'image/jpeg', 'image/webp'], video: ['video/mp4'] };
const anexosValidos = (lista) => Array.isArray(lista) && lista.length <= 10 && lista.every((a) => a
  && typeof a.url === 'string' && a.url.startsWith('https://raw.githubusercontent.com/Nicevargas/Site_professor/')
  && TIPOS[a.tipo] && TIPOS[a.tipo].includes(a.mime));
const limparAnexos = (lista) => (lista || []).map((a) => ({ url: a.url, nome: String(a.nome || 'arquivo'), tipo: a.tipo, mime: a.mime }));
const resumoDosAnexos = (lista) => {
  const imagens = lista.filter((a) => a.tipo === 'image').length;
  const videos = lista.filter((a) => a.tipo === 'video').length;
  return [imagens ? imagens + ' imagem(ns)' : '', videos ? videos + ' vídeo(s)' : ''].filter(Boolean).join(' e ');
};
const dados = $getWorkflowStaticData('global');
dados.pendentes = dados.pendentes || {};
const agora = Date.now();
for (const [t, p] of Object.entries(dados.pendentes)) {
  if (agora - p.criadoEm > CONFIG.validadeMs) delete dados.pendentes[t];
  // Pendente guardado antes de existirem anexos
  else p.anexos = p.anexos || [];
}`;

  return {
    // --- 1. Novidade chegou do GitHub: guarda e prepara a prévia
    guardar: `${comum}
const b = $input.first().json.body || {};
const valido = typeof b.token === 'string' && /^[A-Za-z0-9_-]{32,}$/.test(b.token)
  && typeof b.texto === 'string' && b.texto.trim() && b.texto.length <= 1000
  && typeof b.imagemUrl === 'string' && b.imagemUrl.startsWith('https://raw.githubusercontent.com/Nicevargas/Site_professor/')
  && anexosValidos(b.anexos || []);
if (!valido) return [{ json: { ok: false, motivo: 'pedido inválido' } }];

// A mesma novidade de novo: se já foi para o grupo, recusa. Se ainda estava
// esperando (a prévia pode ter falhado no meio), a nova substitui a antiga e
// o link antigo deixa de valer.
for (const [t, p] of Object.entries(dados.pendentes)) {
  if (p.id !== b.id) continue;
  if (p.enviado) return [{ json: { ok: false, motivo: 'novidade já enviada no grupo' } }];
  delete dados.pendentes[t];
}

dados.pendentes[b.token] = {
  id: String(b.id || ''),
  titulo: String(b.titulo || 'Novidade'),
  texto: b.texto,
  imagemUrl: b.imagemUrl,
  anexos: limparAnexos(b.anexos),
  criadoEm: agora,
  enviado: false,
};
return [{ json: {
  ok: true,
  numero: CONFIG.numeroPrevia,
  imagemUrl: b.imagemUrl,
  legenda: '🔎 *PRÉVIA — só você está vendo*\\n\\n' + b.texto,
  arquivo: b.imagemUrl.split('/').pop(),
  aviso: '✅ *Para enviar no grupo ' + CONFIG.nomeDoGrupo + '*, abra o link e toque em Enviar no grupo:\\n' + CONFIG.linkAprovar + '?t=' + b.token + '\\n\\nSe não quiser enviar, é só ignorar. O link vale 7 dias.',
  anexos: limparAnexos(b.anexos),
} }];`,

    // --- anexos, um item por arquivo (sem anexo = nada a enviar)
    anexos: `const d = $('__ORIGEM__').first().json;
return (d.anexos || []).map((a) => ({ json: { numero: d.numero, url: a.url, nome: a.nome, tipo: a.tipo, mime: a.mime } }));`,

    // --- 2. Link aberto: mostra a novidade e o botão. NÃO envia nada.
    pagina: `${comum}
const t = String(($input.first().json.query || {}).t || '');
const p = dados.pendentes[t];
if (!p) return [{ json: { html: pagina('Link inválido', '<h1>Link inválido ou vencido</h1><p>Esta novidade não está mais esperando aprovação.</p>') } }];
if (p.enviado) return [{ json: { html: pagina('Já enviada', '<h1>✅ Já foi enviada</h1><p>Esta novidade já está no grupo ' + escapar(CONFIG.nomeDoGrupo) + '.</p>') } }];
const anexos = p.anexos.length ? '<p>Vai junto: ' + resumoDosAnexos(p.anexos) + '.</p>' + p.anexos.filter((a) => a.tipo === 'image').map((a) => '<img src="' + escapar(a.url) + '" alt="">').join('') : '';
return [{ json: { html: pagina('Enviar no grupo?', '<h1>Enviar no grupo ' + escapar(CONFIG.nomeDoGrupo) + '?</h1><p><strong>' + escapar(p.titulo) + '</strong></p><img src="' + escapar(p.imagemUrl) + '" alt=""><pre>' + escapar(p.texto) + '</pre>' + anexos + '<form method="post"><input type="hidden" name="t" value="' + escapar(t) + '"><button type="submit">Enviar no grupo</button></form><p>Para não enviar, é só fechar esta página.</p>') } }];`,

    // --- 3. Botão tocado: confere, marca como enviada e libera o envio
    aprovar: `${comum}
const entrada = $input.first().json;
const t = String((entrada.body || {}).t || (entrada.query || {}).t || '');
const p = dados.pendentes[t];
if (!p) return [{ json: { ok: false, html: pagina('Link inválido', '<h1>Link inválido ou vencido</h1><p>Nada foi enviado.</p>') } }];
if (p.enviado) return [{ json: { ok: false, html: pagina('Já enviada', '<h1>✅ Já foi enviada</h1><p>Esta novidade já está no grupo. Não enviei de novo.</p>') } }];
// Marca ANTES de enviar: dois toques seguidos no botão não viram duas mensagens no grupo
p.enviado = true;
p.enviadoEm = agora;
return [{ json: {
  ok: true,
  numero: CONFIG.grupo,
  imagemUrl: p.imagemUrl,
  legenda: p.texto,
  arquivo: p.imagemUrl.split('/').pop(),
  anexos: p.anexos,
  html: pagina('Enviada', '<h1>✅ Enviada no grupo ' + escapar(CONFIG.nomeDoGrupo) + '</h1><p>' + escapar(p.titulo) + (p.anexos.length ? ' — ' + resumoDosAnexos(p.anexos) + ' chegam em seguida.' : '') + '</p>'),
} }];`,
  };
}

export function montarFluxo(opcoes = {}) {
  const cfg = { ...PADRAO, ...opcoes };
  const js = codigos(cfg);
  const evo = (acao) => `${cfg.evolution}/message/${acao}/${cfg.instancia}`;
  const credEvo = { httpHeaderAuth: cfg.credencialEvolution };

  let x = 0;
  const pos = (coluna, linha) => [240 * coluna, 220 * linha];

  const webhook = (name, method, path, linha, extra = {}) => ({
    name,
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2,
    position: pos(0, linha),
    webhookId: `aquagenda-${path}-${method.toLowerCase()}`,
    parameters: { httpMethod: method, path, responseMode: 'responseNode', options: {}, ...extra.parameters },
    ...(extra.credentials ? { credentials: extra.credentials } : {}),
  });
  const codigo = (name, jsCode, coluna, linha) => ({
    name,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: pos(coluna, linha),
    parameters: { jsCode },
  });
  const se = (name, coluna, linha) => ({
    name,
    type: 'n8n-nodes-base.if',
    typeVersion: 2.2,
    position: pos(coluna, linha),
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [{ id: `cond-${++x}`, leftValue: '={{ $json.ok }}', rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
      options: {},
    },
  });
  const http = (name, acao, corpo, coluna, linha) => ({
    name,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: pos(coluna, linha),
    credentials: credEvo,
    parameters: {
      method: 'POST',
      url: evo(acao),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: corpo,
      options: { timeout: 120000 },
    },
  });
  const responder = (name, tipo, corpo, coluna, linha, codigoHttp = 200) => ({
    name,
    type: 'n8n-nodes-base.respondToWebhook',
    typeVersion: 1.1,
    position: pos(coluna, linha),
    parameters:
      tipo === 'json'
        ? { respondWith: 'json', responseBody: corpo, options: { responseCode: codigoHttp } }
        : { respondWith: 'text', responseBody: corpo, options: { responseCode: codigoHttp, responseHeaders: { entries: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }] } } },
  });

  const corpoImagem = (origem) =>
    `={{ JSON.stringify({ number: $('${origem}').first().json.numero, mediatype: 'image', media: $('${origem}').first().json.imagemUrl, caption: $('${origem}').first().json.legenda, fileName: $('${origem}').first().json.arquivo, delay: 1200 }) }}`;
  const corpoAnexo = `={{ JSON.stringify({ number: $json.numero, mediatype: $json.tipo, mimetype: $json.mime, media: $json.url, fileName: $json.nome, caption: '', delay: 2500 }) }}`;

  const nodes = [
    // 1. GitHub → prévia
    webhook('Novidade do GitHub', 'POST', 'aquagenda-novidade', 0, {
      parameters: { authentication: 'headerAuth' },
      credentials: { httpHeaderAuth: cfg.credencialToken },
    }),
    codigo('Guardar pendente', js.guardar, 1, 0),
    se('Pedido válido?', 2, 0),
    http('Prévia: imagem e texto', 'sendMedia', corpoImagem('Guardar pendente'), 3, 0),
    http(
      'Prévia: link de aprovação',
      'sendText',
      `={{ JSON.stringify({ number: $('Guardar pendente').first().json.numero, text: $('Guardar pendente').first().json.aviso, linkPreview: false, delay: 1200 }) }}`,
      4,
      0
    ),
    responder('Responder ao GitHub', 'json', '={{ JSON.stringify({ ok: true }) }}', 5, 0),
    codigo('Anexos da prévia', js.anexos.replace('__ORIGEM__', 'Guardar pendente'), 6, 0),
    http('Prévia: anexo', 'sendMedia', corpoAnexo, 7, 0),
    responder('Recusar pedido', 'json', `={{ JSON.stringify({ ok: false, motivo: $json.motivo }) }}`, 3, 0.6, 400),

    // 2. Link aberto → página com o botão
    webhook('Abrir aprovação', 'GET', 'aquagenda-aprovar', 2),
    codigo('Montar página', js.pagina, 1, 2),
    responder('Mostrar página', 'html', '={{ $json.html }}', 2, 2),

    // 3. Botão → grupo
    webhook('Aprovar envio', 'POST', 'aquagenda-aprovar', 3),
    codigo('Conferir aprovação', js.aprovar, 1, 3),
    se('Pode enviar?', 2, 3),
    http('Grupo: imagem e texto', 'sendMedia', corpoImagem('Conferir aprovação'), 3, 3),
    responder('Confirmar envio', 'html', `={{ $('Conferir aprovação').first().json.html }}`, 4, 3),
    codigo('Anexos do grupo', js.anexos.replace('__ORIGEM__', 'Conferir aprovação'), 5, 3),
    http('Grupo: anexo', 'sendMedia', corpoAnexo, 6, 3),
    responder('Não enviar', 'html', '={{ $json.html }}', 3, 3.6),
  ];

  const liga = (de, para, saida = 0) => ({ de, para, saida });
  const ligacoes = [
    liga('Novidade do GitHub', 'Guardar pendente'),
    liga('Guardar pendente', 'Pedido válido?'),
    liga('Pedido válido?', 'Prévia: imagem e texto', 0),
    liga('Pedido válido?', 'Recusar pedido', 1),
    liga('Prévia: imagem e texto', 'Prévia: link de aprovação'),
    liga('Prévia: link de aprovação', 'Responder ao GitHub'),
    liga('Responder ao GitHub', 'Anexos da prévia'),
    liga('Anexos da prévia', 'Prévia: anexo'),

    liga('Abrir aprovação', 'Montar página'),
    liga('Montar página', 'Mostrar página'),

    liga('Aprovar envio', 'Conferir aprovação'),
    liga('Conferir aprovação', 'Pode enviar?'),
    liga('Pode enviar?', 'Grupo: imagem e texto', 0),
    liga('Pode enviar?', 'Não enviar', 1),
    liga('Grupo: imagem e texto', 'Confirmar envio'),
    liga('Confirmar envio', 'Anexos do grupo'),
    liga('Anexos do grupo', 'Grupo: anexo'),
  ];

  const connections = {};
  for (const { de, para, saida } of ligacoes) {
    connections[de] = connections[de] || { main: [] };
    while (connections[de].main.length <= saida) connections[de].main.push([]);
    connections[de].main[saida].push({ node: para, type: 'main', index: 0 });
  }

  return {
    name: 'Aquagenda - novidade com aprovação',
    nodes: nodes.map((n, i) => ({ id: `aquagenda-aprov-${String(i + 1).padStart(2, '0')}`, ...n })),
    connections,
    active: false,
    settings: { executionOrder: 'v1' },
    pinData: {},
  };
}

// node automacoes/aprovacao/montar-fluxo.mjs > automacoes/aprovacao/novidade-com-aprovacao.json
if (process.argv[1]?.replace(/\\/g, '/').endsWith('aprovacao/montar-fluxo.mjs')) {
  process.stdout.write(JSON.stringify(montarFluxo(), null, 2) + '\n');
}
