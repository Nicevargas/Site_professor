#!/usr/bin/env node
/**
 * Print de uma tela do Aquagenda para divulgar novidade no WhatsApp.
 *
 * Sobe o site em MODO DEMONSTRAÇÃO (sem banco: só dados de exemplo, nunca de
 * aluno ou professor de verdade), abre o Chrome ou Edge já instalado sem
 * janela e faz o que uma pessoa faria: entra pelo botão de demonstração
 * "Prof. Roberto", vai para a tela pedida, segue os passos e salva o PNG.
 *
 * O botão de demonstração só existe sem banco. Se ele não aparecer, o script
 * para: é sinal de que o site subiu ligado a dados reais.
 *
 * Não instala nem baixa nada: fala com o navegador pelo protocolo DevTools
 * usando o WebSocket que já vem no Node.
 *
 * Uso:
 *   node scripts/print-novidade.mjs --rota horarios --saida novidades/imagens/x.png \
 *     [--preencher 'css::valor'] [--clicar "texto ou aria-label"] [--rolar "css"] \
 *     [--esperar 1000] [--sem-login] [--largura 540] [--altura 960] [--escala 2]
 *
 * Os passos (--preencher, --clicar, --rolar, --esperar) rodam na ordem escrita.
 * Padrão: 540x960 com escala 2 = imagem de 1080 px, a tela como no celular.
 */
import { spawn, execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const BOTAO_DEMO = 'Prof. Roberto';

class Parar extends Error {}

// ---------------------------------------------------------------- opções
const opcoes = {
  rota: '#/painel',
  saida: null,
  largura: 540,
  altura: 960,
  escala: 2,
  espera: 2500,
  porta: 5198,
  portaNavegador: 9333,
  login: true,
  passos: [],
};
function sair(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const nome = args[i];
  const valor = args[i + 1];
  const numero = () => {
    const n = Number(valor);
    if (!Number.isFinite(n)) sair(`${nome} precisa de um número`);
    i++;
    return n;
  };
  switch (nome) {
    case '--rota': opcoes.rota = valor; i++; break;
    case '--saida': opcoes.saida = valor; i++; break;
    case '--largura': opcoes.largura = numero(); break;
    case '--altura': opcoes.altura = numero(); break;
    case '--escala': opcoes.escala = numero(); break;
    case '--porta': opcoes.porta = numero(); break;
    case '--sem-login': opcoes.login = false; break;
    case '--clicar': opcoes.passos.push({ tipo: 'clicar', valor }); i++; break;
    case '--preencher': opcoes.passos.push({ tipo: 'preencher', valor }); i++; break;
    case '--rolar': opcoes.passos.push({ tipo: 'rolar', valor }); i++; break;
    case '--esconder': opcoes.passos.push({ tipo: 'esconder', valor }); i++; break;
    case '--esperar': opcoes.passos.push({ tipo: 'esperar', valor: numero() }); break;
    default: sair(`opção desconhecida: ${nome}`);
  }
}
if (!opcoes.saida) sair('informe --saida com o caminho do PNG');

/**
 * A rota pode vir só com o nome da tela ("horarios"). No Windows, o Git Bash
 * troca "#/horarios" por "#C:/Program Files/Git/horarios", achando que é uma
 * pasta; o nome sem barra passa intacto. Aceita os dois jeitos.
 */
opcoes.rota = `#/${String(opcoes.rota).split('/').pop().replace(/^#/, '')}`;

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------- nunca print com banco de verdade
for (const arquivo of ['.env', '.env.local', '.env.development', '.env.development.local']) {
  if (existsSync(arquivo) && /^\s*VITE_SUPABASE_URL\s*=\s*\S+/m.test(readFileSync(arquivo, 'utf8'))) {
    sair(`${arquivo} liga o banco de verdade. Print de novidade só em modo demonstração: rode numa cópia sem esse arquivo.`);
  }
}

// ---------------------------------------------------------------- processos
const processos = [];
function encerrar(proc) {
  if (!proc || proc.exitCode !== null) return;
  try {
    if (process.platform === 'win32') execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    else proc.kill('SIGTERM');
  } catch {
    // já tinha fechado
  }
}

async function esperarResposta(url, ms, oQue) {
  const limite = Date.now() + ms;
  while (Date.now() < limite) {
    try {
      const r = await fetch(url);
      if (r.ok) return r;
    } catch {
      // ainda subindo
    }
    await dormir(500);
  }
  throw new Parar(`${oQue} não respondeu em ${Math.round(ms / 1000)} s (${url})`);
}

async function portaLivre(porta) {
  try {
    await fetch(`http://localhost:${porta}/`);
    return false;
  } catch {
    return true;
  }
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
  if (!achado) throw new Parar('Chrome ou Edge não encontrado. Informe o caminho em NAVEGADOR=...');
  return achado;
}

// ------------------------------------------------------ protocolo DevTools
function conectar(url) {
  return new Promise((pronto, erro) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pendentes = new Map();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString());
      if (!msg.id || !pendentes.has(msg.id)) return;
      const { resolve, reject } = pendentes.get(msg.id);
      pendentes.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    };
    ws.onerror = () => erro(new Parar('não foi possível conectar ao navegador'));
    ws.onopen = () =>
      pronto({
        enviar: (method, params = {}) =>
          new Promise((resolve, reject) => {
            const n = ++id;
            pendentes.set(n, { resolve, reject });
            ws.send(JSON.stringify({ id: n, method, params }));
          }),
        fechar: () => ws.close(),
      });
  });
}

// ---------------------------------------------------------------- execução
let perfil;
let cdp;
let avaliar;
try {
  // 1. Site em modo demonstração, numa porta só dele
  const base = `http://localhost:${opcoes.porta}/`;
  if (!(await portaLivre(opcoes.porta))) {
    throw new Parar(`a porta ${opcoes.porta} já está em uso. Feche o que estiver nela ou use --porta.`);
  }
  const vite = spawn(`npx vite --port ${opcoes.porta} --strictPort`, {
    shell: true,
    stdio: 'ignore',
    env: { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
  });
  processos.push(vite);
  await esperarResposta(base, 90000, 'O site local');

  // 2. Navegador sem janela, com perfil temporário (sem nada guardado)
  perfil = mkdtempSync(join(tmpdir(), 'aquagenda-print-'));
  const navegador = spawn(
    acharNavegador(),
    [
      '--headless=new',
      `--remote-debugging-port=${opcoes.portaNavegador}`,
      `--user-data-dir=${perfil}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      '--disable-gpu',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );
  processos.push(navegador);
  const lista = await (await esperarResposta(`http://127.0.0.1:${opcoes.portaNavegador}/json/list`, 30000, 'O navegador')).json();
  const aba = lista.find((t) => t.type === 'page');
  if (!aba) throw new Parar('o navegador abriu sem nenhuma aba');
  cdp = await conectar(aba.webSocketDebuggerUrl);

  avaliar = async (expressao) => {
    const r = await cdp.enviar('Runtime.evaluate', { expression: expressao, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Parar(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const esperarAte = async (expressao, ms, oQue) => {
    const limite = Date.now() + ms;
    while (Date.now() < limite) {
      try {
        if (await avaliar(expressao)) return;
      } catch {
        // página ainda trocando
      }
      await dormir(300);
    }
    throw new Parar(`tempo esgotado esperando ${oQue}`);
  };

  await cdp.enviar('Emulation.setDeviceMetricsOverride', {
    width: opcoes.largura,
    height: opcoes.altura,
    deviceScaleFactor: opcoes.escala,
    mobile: opcoes.largura < 768,
  });

  // 3. Tela de entrar, como qualquer pessoa
  await cdp.enviar('Page.navigate', { url: `${base}#/entrar` });
  // Na primeira vez o site local compila tudo e pode levar mais de 30 s
  await esperarAte(`location.hash === '#/entrar' && document.readyState === 'complete' && !!document.querySelector('form')`, 120000, 'a tela de entrar');
  await dormir(1000);

  // 4. Login pelo botão de demonstração (só existe sem banco)
  if (opcoes.login) {
    const r = await avaliar(`(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.innerText.includes(${JSON.stringify(BOTAO_DEMO)}));
      if (!b) return false;
      b.click();
      return true;
    })()`);
    if (!r) throw new Parar(`o botão de demonstração "${BOTAO_DEMO}" não apareceu: o site pode estar ligado ao banco. Print cancelado.`);
    await esperarAte(`location.hash !== '#/entrar'`, 15000, 'o login de demonstração');
    await dormir(1500);
  }

  // 5. Vai para a tela pedida sem recarregar (o login fica)
  if (opcoes.rota && opcoes.rota !== '#/entrar') {
    await avaliar(`location.hash = ${JSON.stringify(opcoes.rota)}; true`);
    await esperarAte(`location.hash === ${JSON.stringify(opcoes.rota)}`, 10000, `a tela ${opcoes.rota}`);
  }
  await dormir(opcoes.espera);

  // 6. Passos, na ordem
  for (const passo of opcoes.passos) {
    if (passo.tipo === 'esperar') {
      await dormir(passo.valor);
    } else if (passo.tipo === 'clicar') {
      const r = await avaliar(`(() => {
        const alvo = ${JSON.stringify(passo.valor)};
        const limpo = (s) => (s || '').replace(/\\s+/g, ' ').trim();
        const candidatos = [...document.querySelectorAll('button, a, label, [role="button"], [role="tab"]')];
        const el = candidatos.find((c) => c.getAttribute('aria-label') === alvo) || candidatos.find((c) => limpo(c.innerText) === alvo);
        if (!el) return 'NAO_ACHOU: ' + candidatos.map((c) => limpo(c.innerText) || c.getAttribute('aria-label')).filter(Boolean).slice(0, 40).join(' | ');
        el.scrollIntoView({ block: 'center' });
        el.click();
        return 'ok';
      })()`);
      if (r !== 'ok') throw new Parar(`não achei "${passo.valor}" para clicar.\n  Na tela: ${r.replace('NAO_ACHOU: ', '')}`);
      await dormir(800);
    } else if (passo.tipo === 'preencher') {
      const corte = passo.valor.lastIndexOf('::');
      if (corte < 0) throw new Parar(`--preencher usa 'css::valor' (recebi ${passo.valor})`);
      const seletor = passo.valor.slice(0, corte);
      const texto = passo.valor.slice(corte + 2);
      const r = await avaliar(`(() => {
        const el = document.querySelector(${JSON.stringify(seletor)});
        if (!el) return 'NAO_ACHOU';
        const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
        setter.call(el, ${JSON.stringify(texto)});
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return 'ok';
      })()`);
      if (r !== 'ok') throw new Parar(`não achei o campo ${seletor}`);
      await dormir(400);
    } else if (passo.tipo === 'esconder') {
      // Tira do print o que o professor de verdade não vê (ex.: botões de demonstração)
      const escondidos = await avaliar(`(() => {
        const els = [...document.querySelectorAll(${JSON.stringify(passo.valor)})];
        els.forEach((el) => { el.style.setProperty('display', 'none', 'important'); });
        return els.length;
      })()`);
      if (!escondidos) throw new Parar(`não achei ${passo.valor} para esconder`);
      await dormir(300);
    } else if (passo.tipo === 'rolar') {
      const r = await avaliar(`(() => {
        const el = document.querySelector(${JSON.stringify(passo.valor)});
        if (!el) return 'NAO_ACHOU';
        el.scrollIntoView({ block: 'center' });
        return 'ok';
      })()`);
      if (r !== 'ok') throw new Parar(`não achei ${passo.valor} para rolar até ele`);
      await dormir(600);
    }
  }

  // 7. Print
  const { data } = await cdp.enviar('Page.captureScreenshot', { format: 'png' });
  mkdirSync(dirname(opcoes.saida), { recursive: true });
  writeFileSync(opcoes.saida, Buffer.from(data, 'base64'));
  console.log(`✓ print salvo em ${opcoes.saida} (${opcoes.largura * opcoes.escala}×${opcoes.altura * opcoes.escala} px)`);
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  // Mostra o que estava na tela quando deu errado (fora do projeto)
  if (cdp) {
    try {
      const { data } = await cdp.enviar('Page.captureScreenshot', { format: 'png' });
      const depuracao = join(tmpdir(), 'aquagenda-print-erro.png');
      writeFileSync(depuracao, Buffer.from(data, 'base64'));
      const onde = avaliar ? await avaliar(`location.href + ' | ' + document.title`) : '';
      console.error(`  Tela no momento do erro: ${onde}\n  Imagem: ${depuracao}\n`);
    } catch {
      // sem como capturar
    }
  }
  process.exitCode = 1;
} finally {
  try {
    await cdp?.enviar('Browser.close');
  } catch {
    // navegador já fechado
  }
  cdp?.fechar();
  processos.reverse().forEach(encerrar);
  await dormir(500);
  if (perfil) rmSync(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
}
