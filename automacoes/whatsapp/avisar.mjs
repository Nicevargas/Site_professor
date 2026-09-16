/**
 * Roda no GitHub Actions (.github/workflows/novidade-whatsapp.yml) a cada push
 * no main que mexe em novidades/. Para cada novidade ADICIONADA, abre uma issue
 * para a Nice com o link de envio.
 *
 * Testar sem abrir issue:
 *   node automacoes/whatsapp/avisar.mjs --simular --arquivos novidades/2026-09-15-domingo-e-aula-gratuita.md
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { avisoDaNovidade, novidadesDaLista } from './aviso.mjs';

const args = process.argv.slice(2);
const simular = args.includes('--simular');
const indiceArquivos = args.indexOf('--arquivos');

const repositorio = process.env.GITHUB_REPOSITORY || 'Nicevargas/Site_professor';
const commit = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD']).toString().trim();
const antes = process.env.ANTES || '';
const responsavel = process.env.RESPONSAVEL || 'Nicevargas';

function arquivosAdicionados() {
  if (indiceArquivos >= 0) return args.slice(indiceArquivos + 1).filter((a) => !a.startsWith('--'));
  // Só arquivo ADICIONADO: editar uma novidade antiga não avisa de novo.
  const saida = /^0*$/.test(antes)
    ? execFileSync('git', ['show', '--name-only', '--diff-filter=A', '--format=', commit])
    : execFileSync('git', ['diff', '--name-only', '--diff-filter=A', antes, commit]);
  return saida.toString().split('\n');
}

async function abrirIssue({ titulo, corpo }) {
  const resposta = await fetch(`https://api.github.com/repos/${repositorio}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: titulo, body: corpo, assignees: [responsavel] }),
  });
  if (!resposta.ok) throw new Error(`GitHub respondeu ${resposta.status}: ${await resposta.text()}`);
  return (await resposta.json()).html_url;
}

const novidades = novidadesDaLista(arquivosAdicionados());
if (novidades.length === 0) {
  console.log('Nenhuma novidade nova neste push.');
  process.exit(0);
}

let falhas = 0;
for (const caminho of novidades) {
  try {
    const aviso = avisoDaNovidade({ markdown: readFileSync(caminho, 'utf8'), caminho, repositorio, commit });
    if (!existsSync(aviso.imagem)) throw new Error(`${caminho}: a imagem ${aviso.imagem} não está no repositório`);
    if (simular) {
      console.log(`\n${aviso.titulo}\n${aviso.link}\n\n${aviso.corpo}`);
    } else {
      console.log(`${caminho} → ${await abrirIssue(aviso)}`);
    }
  } catch (erro) {
    falhas++;
    console.error(`FALHOU ${caminho}: ${erro.message}`);
  }
}
process.exit(falhas ? 1 : 0);
