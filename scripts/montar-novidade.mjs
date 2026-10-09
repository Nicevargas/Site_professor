#!/usr/bin/env node
/**
 * Junta vários prints numa imagem só, para a novidade do WhatsApp.
 *
 * Com duas imagens separadas, a segunda chega solta no grupo, sem texto nem
 * contexto. Aqui as telas ficam lado a lado, numeradas, cada uma com a sua
 * legenda, sob um título: uma mensagem só, que se explica sozinha.
 *
 * Não instala nada: monta uma página e tira a foto com o Chrome ou Edge já
 * instalado (o mesmo que o print-novidade.mjs usa).
 *
 * Uso:
 *   node scripts/montar-novidade.mjs --saida novidades/imagens/2026-10-09-x.png \
 *     --titulo "Aquagenda melhor no celular" \
 *     --tela "print1.png::Duração de 40 min e limite de alunos" \
 *     --tela "print2.png::Salvar horários aparece no celular"
 *
 * De 2 a 4 telas. Cada --tela é "caminho::legenda".
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function sair(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

const opcoes = { saida: null, titulo: '', telas: [] };
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const valor = args[i + 1];
  switch (args[i]) {
    case '--saida': opcoes.saida = valor; i++; break;
    case '--titulo': opcoes.titulo = valor; i++; break;
    case '--tela': {
      const [caminho, ...resto] = String(valor).split('::');
      opcoes.telas.push({ caminho, legenda: resto.join('::').trim() });
      i++;
      break;
    }
    default: sair(`opção desconhecida: ${args[i]}`);
  }
}
if (!opcoes.saida) sair('informe --saida com o caminho do PNG');
if (opcoes.telas.length < 2 || opcoes.telas.length > 4) sair('informe de 2 a 4 telas com --tela "caminho::legenda"');
for (const t of opcoes.telas) {
  if (!existsSync(t.caminho)) sair(`não achei o print ${t.caminho}`);
  if (!t.legenda) sair(`a tela ${t.caminho} precisa de legenda: --tela "caminho::legenda"`);
}

function acharNavegador() {
  const locais = [
    process.env.NAVEGADOR,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  const achado = locais.find((c) => existsSync(c));
  if (!achado) sair('Chrome ou Edge não encontrado. Informe o caminho em NAVEGADOR=...');
  return achado;
}

const escapar = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const emBase64 = (caminho) => `data:image/png;base64,${readFileSync(caminho).toString('base64')}`;

// Largura de cada tela: quanto mais telas, mais estreita, para caber sem ficar miúda no celular
const n = opcoes.telas.length;
const larguraTela = n === 2 ? 470 : n === 3 ? 380 : 320;
const espaco = 36;
const margem = 48;
const largura = margem * 2 + n * larguraTela + (n - 1) * espaco;
// Os prints são 9:16; a legenda ocupa até 3 linhas
const alturaTela = Math.round((larguraTela * 16) / 9);
const altura = 150 + (opcoes.titulo ? 70 : 0) + alturaTela + 120;

const logo = existsSync('public/icon-192.png') ? emBase64('public/icon-192.png') : '';

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
body{width:${largura}px;height:${altura}px;background:linear-gradient(160deg,#091426 0%,#0b2a3a 55%,#00687a 100%);font-family:"Segoe UI",system-ui,Arial,sans-serif;color:#fff;padding:${margem}px;overflow:hidden}
header{display:flex;align-items:center;gap:14px;height:54px}
header img{width:46px;height:46px;border-radius:12px;background:#fff;padding:4px}
header span{font-size:26px;font-weight:800;letter-spacing:-.3px}
header em{margin-left:auto;font-style:normal;font-size:16px;font-weight:700;color:#091426;background:#57dffe;padding:6px 14px;border-radius:999px}
h1{font-size:34px;font-weight:800;line-height:1.15;margin-top:22px;height:48px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
main{display:flex;gap:${espaco}px;margin-top:26px}
figure{width:${larguraTela}px}
.tela{position:relative;width:${larguraTela}px;height:${alturaTela}px;border-radius:26px;overflow:hidden;background:#fff;border:5px solid rgba(255,255,255,.92);box-shadow:0 18px 40px rgba(0,0,0,.45)}
.tela img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
.num{position:absolute;top:14px;left:14px;width:46px;height:46px;border-radius:50%;background:#57dffe;color:#091426;font-size:24px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,.35)}
figcaption{margin-top:16px;font-size:${n === 2 ? 22 : 19}px;font-weight:600;line-height:1.3;color:#e8f7fb;display:flex;gap:10px}
figcaption b{color:#57dffe}
</style></head><body>
<header>${logo ? `<img src="${logo}" alt="">` : ''}<span>Aquagenda</span><em>Novidade</em></header>
${opcoes.titulo ? `<h1>${escapar(opcoes.titulo)}</h1>` : ''}
<main>${opcoes.telas
  .map(
    (t, i) => `<figure><div class="tela"><img src="${emBase64(t.caminho)}" alt=""><div class="num">${i + 1}</div></div><figcaption><b>${i + 1}.</b><span>${escapar(t.legenda)}</span></figcaption></figure>`
  )
  .join('')}</main>
</body></html>`;

const pasta = mkdtempSync(join(tmpdir(), 'aquagenda-montagem-'));
const pagina = join(pasta, 'montagem.html');
const perfil = join(pasta, 'perfil');
writeFileSync(pagina, html);
mkdirSync(dirname(resolve(opcoes.saida)), { recursive: true });

try {
  execFileSync(
    acharNavegador(),
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--user-data-dir=${perfil}`,
      `--window-size=${largura},${altura}`,
      `--screenshot=${resolve(opcoes.saida)}`,
      pathToFileURL(pagina).href,
    ],
    { stdio: 'ignore', timeout: 60000 }
  );
} finally {
  rmSync(pasta, { recursive: true, force: true, maxRetries: 5 });
}

if (!existsSync(opcoes.saida)) sair('o navegador não gerou a imagem');
console.log(`✓ montagem salva em ${opcoes.saida} (${largura}×${altura} px, ${n} telas)`);
