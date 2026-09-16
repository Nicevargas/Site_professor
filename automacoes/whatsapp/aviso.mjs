/**
 * Novidade no GitHub → aviso para a Nice enviar no grupo de WhatsApp com 1 toque.
 *
 * Sem servidor: quando uma novidade nova chega no main, o GitHub Actions abre
 * uma issue para a Nice (chega por e-mail e no app do GitHub). A issue traz um
 * link para public/compartilhar-novidade.html, que abre o WhatsApp do celular
 * com a imagem e o texto prontos; ela só escolhe o grupo.
 *
 * Texto e imagem saem das mesmas regras do fluxo antigo (../n8n/novidade.mjs).
 */
import { extrairMensagem, urlBruta } from '../n8n/novidade.mjs';

export { extrairMensagem, urlBruta };

export const PAGINA_DE_ENVIO = 'https://aquagenda.plataformaeducar.net/compartilhar-novidade.html';

/** A página só aceita imagem deste repositório: ninguém usa o link para mostrar outra coisa. */
export const ORIGEM_DAS_IMAGENS = 'https://raw.githubusercontent.com/Nicevargas/Site_professor/';

const ARQUIVO_NOVIDADE = /^novidades\/\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/;

/** Arquivos de novidade de uma lista de caminhos, na ordem da data (o README não entra). */
export function novidadesDaLista(caminhos) {
  return [...new Set((caminhos || []).map((c) => String(c).trim()).filter((c) => ARQUIVO_NOVIDADE.test(c)))].sort();
}

/**
 * Link da página de envio. Texto e imagem vão depois do "#": não saem do
 * celular para o servidor do site, só a página lê.
 */
export function linkParaEnviar({ texto, imagemUrl }) {
  if (!texto) throw new Error('falta o texto da novidade');
  if (!imagemUrl || !imagemUrl.startsWith(ORIGEM_DAS_IMAGENS)) {
    throw new Error(`a imagem precisa vir de ${ORIGEM_DAS_IMAGENS}`);
  }
  return `${PAGINA_DE_ENVIO}#texto=${encodeURIComponent(texto)}&imagem=${encodeURIComponent(imagemUrl)}`;
}

/** Título da novidade: a linha "# ..." do arquivo, ou o nome do arquivo. */
export function tituloDaNovidade(markdown, caminho) {
  const linha = String(markdown).replace(/\r\n/g, '\n').split('\n').find((l) => l.startsWith('# '));
  return linha ? linha.slice(2).trim() : String(caminho).split('/').pop().replace(/\.md$/, '');
}

/**
 * Título e corpo da issue que avisa a Nice. A imagem e o link ficam travados
 * no commit, então não mudam se o arquivo for editado depois.
 */
export function avisoDaNovidade({ markdown, caminho, repositorio, commit }) {
  const { texto, imagem } = extrairMensagem(markdown, caminho);
  if (!imagem) {
    throw new Error(`${caminho}: a novidade precisa de imagem (seção "## Imagem" apontando para imagens/...)`);
  }
  const imagemUrl = urlBruta(repositorio, commit, imagem);
  const link = linkParaEnviar({ texto, imagemUrl });
  const titulo = tituloDaNovidade(markdown, caminho);
  const citacao = texto.split('\n').map((l) => `> ${l}`).join('\n');

  const corpo = [
    '## 📣 Novidade pronta para o grupo dos professores',
    '',
    `### [👉 Abrir para enviar no WhatsApp](${link})`,
    '',
    'No celular: toque no link acima, depois em **Enviar no WhatsApp** e escolha o grupo dos professores.',
    '',
    '### Texto',
    citacao,
    '',
    '### Imagem',
    `![${titulo}](${imagemUrl})`,
    '',
    '---',
    `Depois de enviar, feche este aviso. Arquivo: \`${caminho}\` · commit \`${String(commit).slice(0, 7)}\``,
  ].join('\n');

  return { titulo: `📣 Enviar no grupo: ${titulo}`, corpo, link, texto, imagem, imagemUrl };
}
