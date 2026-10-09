/**
 * Novidade no GitHub → prévia no WhatsApp da Nice → ela aprova → vai para o grupo.
 *
 * Aqui ficam só as regras (sem rede): o que o GitHub Actions manda para o
 * n8n. O fluxo do n8n está em montar-fluxo.mjs.
 *
 * Texto, imagem e título saem das mesmas regras do aviso por issue
 * (../whatsapp/aviso.mjs). A novidade pode trazer vídeos numa seção opcional:
 *
 *   ## Vídeos
 *   videos/2026-10-09-tutorial.mp4: como conectar o Mercado Pago
 */
import { avisoDaNovidade, tituloDaNovidade, urlBruta } from '../whatsapp/aviso.mjs';

/** O WhatsApp recusa vídeo grande; 16 MB é o limite seguro para enviar como vídeo. */
export const LIMITE_VIDEO_BYTES = 16 * 1024 * 1024;

/** Vídeos da seção "## Vídeos", como caminhos no repositório (novidades/videos/x.mp4). */
export function videosDaNovidade(markdown, caminho) {
  const linhas = String(markdown).replace(/\r\n/g, '\n').split('\n');
  const inicio = linhas.findIndex((l) => l.startsWith('## ') && /^v[ií]deos?/i.test(l.slice(3).trim()));
  if (inicio < 0) return [];
  const fimRelativo = linhas.slice(inicio + 1).findIndex((l) => l.startsWith('## '));
  const secao = linhas.slice(inicio + 1, fimRelativo < 0 ? linhas.length : inicio + 1 + fimRelativo).join('\n');
  const pasta = caminho.slice(0, caminho.lastIndexOf('/'));
  const achados = secao.match(/videos\/[A-Za-z0-9._-]+\.mp4/gi) || [];
  return [...new Set(achados)].map((v) => `${pasta}/${v}`);
}

/**
 * O que vai para o n8n. `token` é o segredo do link de aprovação: quem o
 * gera é o GitHub Actions, e ele nunca aparece em log nem em issue (o
 * repositório é público).
 */
export function pedidoDePrevia({ markdown, caminho, repositorio, commit, token }) {
  if (!/^[A-Za-z0-9_-]{32,}$/.test(String(token || ''))) throw new Error('token de aprovação inválido');
  const aviso = avisoDaNovidade({ markdown, caminho, repositorio, commit });
  const videos = videosDaNovidade(markdown, caminho);
  return {
    // Mesmo id para o mesmo arquivo: reenviar o aviso não duplica a novidade
    id: caminho,
    token,
    titulo: tituloDaNovidade(markdown, caminho),
    texto: aviso.texto,
    imagemUrl: aviso.imagemUrl,
    videos: videos.map((v) => ({ url: urlBruta(repositorio, commit, v), nome: v.split('/').pop(), caminho: v })),
  };
}
