/**
 * Novidade no GitHub → prévia no WhatsApp da Nice → ela aprova → vai para o grupo.
 *
 * Aqui ficam só as regras (sem rede): o que o GitHub Actions manda para o
 * n8n. O fluxo do n8n está em montar-fluxo.mjs.
 *
 * Texto, imagem e título saem das mesmas regras do aviso por issue
 * (../whatsapp/aviso.mjs). Duas seções opcionais trazem anexos, que seguem
 * depois da imagem principal:
 *
 *   ## Mais imagens
 *   imagens/2026-10-09-outra-tela.png: o que o print mostra
 *
 *   ## Vídeos
 *   videos/2026-10-09-tutorial.mp4: como conectar o Mercado Pago
 */
import { avisoDaNovidade, tituloDaNovidade, urlBruta } from '../whatsapp/aviso.mjs';

/** O WhatsApp recusa vídeo grande; 16 MB é o limite seguro para enviar como vídeo. */
export const LIMITE_VIDEO_BYTES = 16 * 1024 * 1024;

/** Arquivos citados numa seção opcional, como caminhos no repositório. */
function arquivosDaSecao(markdown, caminho, titulo, padrao) {
  const linhas = String(markdown).replace(/\r\n/g, '\n').split('\n');
  const inicio = linhas.findIndex((l) => l.startsWith('## ') && titulo.test(l.slice(3).trim()));
  if (inicio < 0) return [];
  const fimRelativo = linhas.slice(inicio + 1).findIndex((l) => l.startsWith('## '));
  const secao = linhas.slice(inicio + 1, fimRelativo < 0 ? linhas.length : inicio + 1 + fimRelativo).join('\n');
  const pasta = caminho.slice(0, caminho.lastIndexOf('/'));
  return [...new Set(secao.match(padrao) || [])].map((v) => `${pasta}/${v}`);
}

/** Vídeos da seção "## Vídeos" (novidades/videos/x.mp4). */
export function videosDaNovidade(markdown, caminho) {
  return arquivosDaSecao(markdown, caminho, /^v[ií]deos?/i, /videos\/[A-Za-z0-9._-]+\.mp4/gi);
}

/** Prints extras da seção "## Mais imagens" (novidades/imagens/x.png). */
export function imagensExtrasDaNovidade(markdown, caminho) {
  return arquivosDaSecao(markdown, caminho, /^mais imagens/i, /imagens\/[A-Za-z0-9._-]+\.(?:png|jpe?g|webp)/gi);
}

function mimeDoArquivo(caminho) {
  const ext = String(caminho).split('.').pop().toLowerCase();
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  return 'image/png';
}

/**
 * O que vai para o n8n. `token` é o segredo do link de aprovação: quem o
 * gera é o GitHub Actions, e ele nunca aparece em log nem em issue (o
 * repositório é público).
 */
export function pedidoDePrevia({ markdown, caminho, repositorio, commit, token }) {
  if (!/^[A-Za-z0-9_-]{32,}$/.test(String(token || ''))) throw new Error('token de aprovação inválido');
  const aviso = avisoDaNovidade({ markdown, caminho, repositorio, commit });
  // Primeiro as imagens (o WhatsApp junta num álbum com a principal), depois os vídeos
  const extras = [
    ...imagensExtrasDaNovidade(markdown, caminho).filter((i) => i !== aviso.imagem),
    ...videosDaNovidade(markdown, caminho),
  ];
  return {
    // Mesmo id para o mesmo arquivo: reenviar o aviso não duplica a novidade
    id: caminho,
    token,
    titulo: tituloDaNovidade(markdown, caminho),
    texto: aviso.texto,
    imagemUrl: aviso.imagemUrl,
    anexos: extras.map((a) => {
      const mime = mimeDoArquivo(a);
      return { url: urlBruta(repositorio, commit, a), nome: a.split('/').pop(), tipo: mime.split('/')[0], mime, caminho: a };
    }),
  };
}
