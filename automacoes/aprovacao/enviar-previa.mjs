/**
 * Roda no GitHub Actions depois de abrir a issue: para cada novidade
 * ADICIONADA no push, pede ao n8n para mandar a prévia no WhatsApp da Nice.
 *
 * Precisa de dois segredos do repositório. Sem eles, não faz nada (a issue
 * com o envio manual continua valendo):
 *   N8N_NOVIDADE_URL    endereço do webhook "Novidade do GitHub" no n8n
 *   N8N_NOVIDADE_TOKEN  valor do cabeçalho X-Aquagenda-Token
 *
 * Testar sem enviar:
 *   node automacoes/aprovacao/enviar-previa.mjs --simular --arquivos novidades/2026-10-09-celular-e-duracao.md
 */
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { novidadesDaLista } from '../whatsapp/aviso.mjs';
import { LIMITE_VIDEO_BYTES, pedidoDePrevia } from './previa.mjs';

const args = process.argv.slice(2);
const simular = args.includes('--simular');
const indiceArquivos = args.indexOf('--arquivos');

const url = process.env.N8N_NOVIDADE_URL || '';
const segredo = process.env.N8N_NOVIDADE_TOKEN || '';
const repositorio = process.env.GITHUB_REPOSITORY || 'Nicevargas/Site_professor';
const commit = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD']).toString().trim();
const antes = process.env.ANTES || '';

if (!simular && (!url || !segredo)) {
  console.log('Prévia no WhatsApp desligada: faltam N8N_NOVIDADE_URL e N8N_NOVIDADE_TOKEN. O envio manual pela issue continua valendo.');
  process.exit(0);
}

function arquivosAdicionados() {
  if (indiceArquivos >= 0) return args.slice(indiceArquivos + 1).filter((a) => !a.startsWith('--'));
  const saida = /^0*$/.test(antes)
    ? execFileSync('git', ['show', '--name-only', '--diff-filter=A', '--format=', commit])
    : execFileSync('git', ['diff', '--name-only', '--diff-filter=A', antes, commit]);
  return saida.toString().split('\n');
}

const novidades = novidadesDaLista(arquivosAdicionados());
if (novidades.length === 0) {
  console.log('Nenhuma novidade nova neste push.');
  process.exit(0);
}

let falhas = 0;
for (const caminho of novidades) {
  try {
    const token = randomBytes(32).toString('base64url');
    const pedido = pedidoDePrevia({ markdown: readFileSync(caminho, 'utf8'), caminho, repositorio, commit, token });
    for (const anexo of pedido.anexos) {
      if (!existsSync(anexo.caminho)) throw new Error(`${caminho}: o arquivo ${anexo.caminho} não está no repositório`);
      const tamanho = statSync(anexo.caminho).size;
      if (tamanho > LIMITE_VIDEO_BYTES) {
        throw new Error(`${anexo.caminho} tem ${(tamanho / 1048576).toFixed(1)} MB; o limite para o WhatsApp é 16 MB`);
      }
    }
    // O token nunca vai para o log: o repositório é público e os logs também
    const resumo = `${caminho}: "${pedido.titulo}", ${pedido.anexos.length} anexo(s)`;
    if (simular) {
      console.log(`[simulação] ${resumo}`);
      console.log(JSON.stringify({ ...pedido, token: '<oculto>' }, null, 2));
      continue;
    }
    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Aquagenda-Token': segredo },
      body: JSON.stringify(pedido),
    });
    if (!resposta.ok) throw new Error(`o n8n respondeu ${resposta.status}: ${(await resposta.text()).slice(0, 200)}`);
    console.log(`Prévia enviada para aprovação → ${resumo}`);
  } catch (erro) {
    falhas++;
    console.error(`FALHOU ${caminho}: ${erro.message}`);
  }
}
process.exit(falhas ? 1 : 0);
