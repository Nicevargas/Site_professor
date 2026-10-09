/**
 * Testes da novidade com aprovação. Rodar com:
 *   node --test automacoes/aprovacao/
 *
 * Os nós de código do n8n são executados aqui com o MESMO texto que vai para
 * o fluxo, trocando só o que o n8n fornece ($input, $getWorkflowStaticData, $).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PADRAO, codigos, montarFluxo } from './montar-fluxo.mjs';
import { imagensExtrasDaNovidade, pedidoDePrevia, videosDaNovidade } from './previa.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));
const repositorio = 'Nicevargas/Site_professor';
const commit = 'abc1234def5678';
const TOKEN = 'T'.repeat(43);

const markdown = `# Pix no WhatsApp
Data: 2026-10-09 · Commit: abc1234 · Para: professores

## Texto para o WhatsApp (copiar a partir daqui)
📲 *Novidade*

Texto com <b>tag</b> & "aspas".

## Imagem
imagens/2026-10-09-pix.png: janela de envio.

## Mais imagens
imagens/2026-10-09-pix.png: a principal repetida não vai duas vezes
imagens/2026-10-09-outra-tela.jpg: outra tela

## Vídeos
videos/2026-10-09-mercado-pago.mp4: como conectar
videos/2026-10-09-asaas.mp4: como conectar
`;

/** Roda um nó de código como o n8n rodaria. */
function rodar(js, { entrada = {}, estatico, nos = {} }) {
  const fn = new Function('$input', '$getWorkflowStaticData', '$', js);
  return fn({ first: () => ({ json: entrada }) }, () => estatico, (nome) => ({ first: () => ({ json: nos[nome] }) }));
}

const cfg = { ...PADRAO, grupo: '120000000000000000@g.us', numeroPrevia: '5551900000000' };
const js = codigos(cfg);
const pedido = () => pedidoDePrevia({ markdown, caminho: 'novidades/2026-10-09-pix.md', repositorio, commit, token: TOKEN });

test('vídeos saem da seção "## Vídeos" e viram endereços travados no commit', () => {
  assert.deepEqual(videosDaNovidade(markdown, 'novidades/2026-10-09-pix.md'), [
    'novidades/videos/2026-10-09-mercado-pago.mp4',
    'novidades/videos/2026-10-09-asaas.mp4',
  ]);
  assert.deepEqual(videosDaNovidade('# x\n\n## Imagem\nimagens/a.png', 'novidades/a.md'), []);
  assert.deepEqual(imagensExtrasDaNovidade(markdown, 'novidades/2026-10-09-pix.md'), [
    'novidades/imagens/2026-10-09-pix.png',
    'novidades/imagens/2026-10-09-outra-tela.jpg',
  ]);
  const p = pedido();
  // Imagens primeiro (viram álbum com a principal), depois vídeos; a principal não repete
  assert.deepEqual(p.anexos.map((a) => [a.nome, a.tipo, a.mime]), [
    ['2026-10-09-outra-tela.jpg', 'image', 'image/jpeg'],
    ['2026-10-09-mercado-pago.mp4', 'video', 'video/mp4'],
    ['2026-10-09-asaas.mp4', 'video', 'video/mp4'],
  ]);
  assert.equal(p.anexos[1].url, `https://raw.githubusercontent.com/${repositorio}/${commit}/novidades/videos/2026-10-09-mercado-pago.mp4`);
  assert.equal(p.imagemUrl, `https://raw.githubusercontent.com/${repositorio}/${commit}/novidades/imagens/2026-10-09-pix.png`);
});

test('token curto ou ausente não gera pedido', () => {
  assert.throws(() => pedidoDePrevia({ markdown, caminho: 'novidades/2026-10-09-pix.md', repositorio, commit, token: 'curto' }), /token/);
});

test('caminho completo: prévia para a Nice, link aberto não envia, botão envia uma vez só', () => {
  const estatico = {};

  // 1. chegou do GitHub
  const [{ json: previa }] = rodar(js.guardar, { entrada: { body: pedido() }, estatico });
  assert.equal(previa.ok, true);
  assert.equal(previa.numero, cfg.numeroPrevia, 'a prévia vai para o número da Nice, não para o grupo');
  assert.match(previa.legenda, /PRÉVIA/);
  assert.ok(previa.aviso.includes(`${cfg.baseN8n}/webhook/aquagenda-aprovar?t=${TOKEN}`));
  assert.equal(previa.anexos.length, 3);

  const anexosPrevia = rodar(js.anexos.replace('__ORIGEM__', 'Guardar pendente'), { estatico, nos: { 'Guardar pendente': previa } });
  assert.deepEqual(anexosPrevia.map((v) => [v.json.numero, v.json.tipo]), [[cfg.numeroPrevia, 'image'], [cfg.numeroPrevia, 'video'], [cfg.numeroPrevia, 'video']]);

  // 2. abrir o link só mostra a página: nada é marcado como enviado
  const [{ json: pagina }] = rodar(js.pagina, { entrada: { query: { t: TOKEN } }, estatico });
  assert.match(pagina.html, /Enviar no grupo AquAgenda\?/);
  assert.match(pagina.html, /<form method="post">/);
  assert.ok(pagina.html.includes('&lt;b&gt;tag&lt;/b&gt; &amp; &quot;aspas&quot;'), 'o texto da novidade entra escapado na página');
  assert.ok(pagina.html.includes('Vai junto: 1 imagem(ns) e 2 vídeo(s).'), 'a página avisa o que segue junto');
  assert.equal(estatico.pendentes[TOKEN].enviado, false);

  // 3. botão: vai para o GRUPO, com o texto sem a palavra "prévia"
  const [{ json: envio }] = rodar(js.aprovar, { entrada: { body: { t: TOKEN } }, estatico });
  assert.equal(envio.ok, true);
  assert.equal(envio.numero, cfg.grupo);
  assert.doesNotMatch(envio.legenda, /PRÉVIA/);
  assert.equal(estatico.pendentes[TOKEN].enviado, true);
  const anexosGrupo = rodar(js.anexos.replace('__ORIGEM__', 'Conferir aprovação'), { estatico, nos: { 'Conferir aprovação': envio } });
  assert.deepEqual(anexosGrupo.map((v) => v.json.numero), [cfg.grupo, cfg.grupo, cfg.grupo]);
  assert.deepEqual(anexosGrupo[0].json, { numero: cfg.grupo, url: envio.anexos[0].url, nome: '2026-10-09-outra-tela.jpg', tipo: 'image', mime: 'image/jpeg' });

  // 4. segundo toque no botão, ou abrir o link de novo: não envia de novo
  const [{ json: repetido }] = rodar(js.aprovar, { entrada: { body: { t: TOKEN } }, estatico });
  assert.equal(repetido.ok, false);
  assert.match(repetido.html, /Já foi enviada/);
  assert.match(rodar(js.pagina, { entrada: { query: { t: TOKEN } }, estatico })[0].json.html, /Já foi enviada/);

  // 5. o GitHub avisar a mesma novidade de novo não gera outra prévia
  const [{ json: denovo }] = rodar(js.guardar, { entrada: { body: { ...pedido(), token: 'N'.repeat(43) } }, estatico });
  assert.equal(denovo.ok, false);
  assert.match(denovo.motivo, /já enviada/);
});

test('token errado não aprova nada', () => {
  const estatico = {};
  rodar(js.guardar, { entrada: { body: pedido() }, estatico });
  for (const t of ['', 'errado', 'X'.repeat(43)]) {
    const [{ json }] = rodar(js.aprovar, { entrada: { body: { t } }, estatico });
    assert.equal(json.ok, false);
    assert.equal(json.numero, undefined);
  }
  assert.equal(estatico.pendentes[TOKEN].enviado, false);
  assert.match(rodar(js.pagina, { entrada: { query: { t: 'errado' } }, estatico })[0].json.html, /inválido ou vencido/);
});

test('pedido com imagem ou vídeo de fora do repositório é recusado', () => {
  const estatico = {};
  const ruins = [
    { ...pedido(), imagemUrl: 'https://exemplo.com/x.png' },
    { ...pedido(), anexos: [{ url: 'https://exemplo.com/x.mp4', nome: 'x.mp4', tipo: 'video', mime: 'video/mp4' }] },
    { ...pedido(), anexos: [{ url: pedido().imagemUrl, nome: 'x.exe', tipo: 'document', mime: 'application/x-msdownload' }] },
    { ...pedido(), texto: 'a'.repeat(1001) },
    { ...pedido(), token: 'curto' },
    {},
  ];
  for (const body of ruins) {
    assert.equal(rodar(js.guardar, { entrada: { body }, estatico })[0].json.ok, false);
  }
  assert.deepEqual(estatico.pendentes, {});
});

test('prévia que falhou pode ser pedida de novo: o link antigo deixa de valer', () => {
  const estatico = {};
  rodar(js.guardar, { entrada: { body: pedido() }, estatico });
  const novo = 'N'.repeat(43);
  assert.equal(rodar(js.guardar, { entrada: { body: { ...pedido(), token: novo } }, estatico })[0].json.ok, true);
  assert.equal(rodar(js.aprovar, { entrada: { body: { t: TOKEN } }, estatico })[0].json.ok, false);
  assert.equal(rodar(js.aprovar, { entrada: { body: { t: novo } }, estatico })[0].json.ok, true);
});

test('pendente guardado antes de existirem anexos ainda pode ser aprovado', () => {
  const estatico = {};
  rodar(js.guardar, { entrada: { body: pedido() }, estatico });
  delete estatico.pendentes[TOKEN].anexos;
  assert.match(rodar(js.pagina, { entrada: { query: { t: TOKEN } }, estatico })[0].json.html, /Enviar no grupo/);
  const [{ json }] = rodar(js.aprovar, { entrada: { body: { t: TOKEN } }, estatico });
  assert.equal(json.ok, true);
  assert.deepEqual(json.anexos, []);
});

test('link de aprovação vence em 7 dias', () => {
  const estatico = {};
  rodar(js.guardar, { entrada: { body: pedido() }, estatico });
  estatico.pendentes[TOKEN].criadoEm = Date.now() - 8 * 24 * 60 * 60 * 1000;
  assert.equal(rodar(js.aprovar, { entrada: { body: { t: TOKEN } }, estatico })[0].json.ok, false);
});

test('fluxo: ligações apontam para nós que existem, e só o POST de aprovar chega ao grupo', () => {
  const fluxo = montarFluxo();
  const nomes = new Set(fluxo.nodes.map((n) => n.name));
  assert.equal(nomes.size, fluxo.nodes.length, 'nomes de nó repetidos');
  for (const [de, { main }] of Object.entries(fluxo.connections)) {
    assert.ok(nomes.has(de), de);
    for (const saida of main) for (const l of saida) assert.ok(nomes.has(l.node), `${de} → ${l.node}`);
  }

  // Quem alcança os nós "Grupo: ..." saindo de cada gatilho
  const alcanca = (inicio) => {
    const vistos = new Set();
    const fila = [inicio];
    while (fila.length) {
      const n = fila.pop();
      if (vistos.has(n)) continue;
      vistos.add(n);
      for (const saida of fluxo.connections[n]?.main || []) for (const l of saida) fila.push(l.node);
    }
    return [...vistos].filter((n) => n.startsWith('Grupo:'));
  };
  assert.deepEqual(alcanca('Novidade do GitHub'), []);
  assert.deepEqual(alcanca('Abrir aprovação'), []);
  assert.equal(alcanca('Aprovar envio').length, 2);

  const gatilhos = fluxo.nodes.filter((n) => n.type.endsWith('.webhook')).map((n) => `${n.parameters.httpMethod} ${n.parameters.path}`);
  assert.deepEqual(gatilhos, ['POST aquagenda-novidade', 'GET aquagenda-aprovar', 'POST aquagenda-aprovar']);
  const entrada = fluxo.nodes.find((n) => n.name === 'Novidade do GitHub');
  assert.equal(entrada.parameters.authentication, 'headerAuth', 'o aviso do GitHub exige o token no cabeçalho');
});

test('o arquivo do repositório é o fluxo gerado, sem grupo nem número de verdade', () => {
  const noRepo = readFileSync(join(aqui, 'novidade-com-aprovacao.json'), 'utf8').replace(/\r\n/g, '\n');
  assert.equal(noRepo, JSON.stringify(montarFluxo(), null, 2) + '\n', 'rode: node automacoes/aprovacao/montar-fluxo.mjs > automacoes/aprovacao/novidade-com-aprovacao.json');
  assert.ok(noRepo.includes('__GRUPO__') && noRepo.includes('__NUMERO_PREVIA__'));
  assert.doesNotMatch(noRepo, /@g\.us|\b55\d{10,11}\b/);
});
