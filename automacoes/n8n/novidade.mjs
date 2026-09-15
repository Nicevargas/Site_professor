/**
 * Regras da automação "novidade no GitHub → grupo de WhatsApp".
 *
 * Este arquivo é a fonte da verdade: gerar-fluxo.mjs copia estas funções para
 * dentro dos nós de código do n8n, e novidade.teste.mjs testa exatamente o
 * mesmo código. Nada de import aqui: o n8n roda o texto puro das funções.
 */

/** Só conteúdo de novidade: novidades/AAAA-MM-DD-assunto.md (o README não entra). */
const ARQUIVO_NOVIDADE = /^novidades\/\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/;

/** Legenda de imagem no WhatsApp corta perto de 1024 caracteres. */
const LIMITE_LEGENDA = 1000;

/**
 * Novidades NOVAS de um push do GitHub, na ordem do nome (data).
 *
 * Só conta arquivo ADICIONADO: editar uma novidade antiga não publica de
 * novo. Push em outra branch ou de outro repositório não publica nada.
 */
export function novidadesDoPush(corpo, config) {
  if (!corpo || !config) return [];
  if (corpo.ref !== `refs/heads/${config.branch}`) return [];
  if (!corpo.repository || corpo.repository.full_name !== config.repositorio) return [];

  const adicionados = new Set();
  const removidos = new Set();
  for (const commit of corpo.commits || []) {
    for (const caminho of commit.added || []) {
      if (ARQUIVO_NOVIDADE.test(caminho)) adicionados.add(caminho);
    }
    for (const caminho of commit.removed || []) removidos.add(caminho);
  }
  return [...adicionados]
    .filter((caminho) => !removidos.has(caminho))
    .sort()
    .map((caminho) => ({ caminho, commit: corpo.after }));
}

/** Endereço público do arquivo no GitHub, travado no commit (não muda depois). */
export function urlBruta(repositorio, commit, caminho) {
  const partes = String(caminho).split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${repositorio}/${commit}/${partes}`;
}

/** Conteúdo de uma seção "## Título" do markdown, até a próxima seção. */
function secaoDoMarkdown(markdown, titulo) {
  const linhas = String(markdown).replace(/\r\n/g, '\n').split('\n');
  const inicio = linhas.findIndex((l) => l.startsWith('## ') && l.slice(3).trim().startsWith(titulo));
  if (inicio < 0) return '';
  const fimRelativo = linhas.slice(inicio + 1).findIndex((l) => l.startsWith('## '));
  const fim = fimRelativo < 0 ? linhas.length : inicio + 1 + fimRelativo;
  return linhas.slice(inicio + 1, fim).join('\n').trim();
}

/**
 * Texto e imagem de uma novidade, no modelo de novidades/README.md.
 * A imagem vem como caminho no repositório (novidades/imagens/x.png).
 */
export function extrairMensagem(markdown, caminho) {
  const texto = secaoDoMarkdown(markdown, 'Texto para o WhatsApp');
  if (!texto) throw new Error(`${caminho}: não achei a seção "## Texto para o WhatsApp"`);
  if (texto.length > LIMITE_LEGENDA) {
    throw new Error(`${caminho}: o texto tem ${texto.length} caracteres; o limite para ir junto da imagem é ${LIMITE_LEGENDA}`);
  }
  const secaoImagem = secaoDoMarkdown(markdown, 'Imagem');
  const achado = secaoImagem.match(/(imagens\/[^\s:]+\.(?:png|jpe?g|webp))/i);
  const pasta = caminho.slice(0, caminho.lastIndexOf('/'));
  return { texto, imagem: achado ? `${pasta}/${achado[1]}` : null };
}

export function mimetypeDaImagem(caminho) {
  const extensao = String(caminho).split('.').pop().toLowerCase();
  if (extensao === 'jpg' || extensao === 'jpeg') return 'image/jpeg';
  if (extensao === 'webp') return 'image/webp';
  return 'image/png';
}

/**
 * Pedido para a Evolution API: imagem com o texto de legenda, ou só texto.
 * Campos conferidos no código da Evolution (SendMediaDto / SendTextDto).
 */
export function montarEnvio({ destino, texto, imagemUrl, arquivoImagem }) {
  if (!destino) throw new Error('falta o destino (ID do grupo ou número de teste)');
  if (imagemUrl) {
    return {
      rota: 'sendMedia',
      corpoEnvio: {
        number: String(destino),
        mediatype: 'image',
        mimetype: mimetypeDaImagem(arquivoImagem || imagemUrl),
        caption: texto,
        media: imagemUrl,
        fileName: String(arquivoImagem || imagemUrl).split('/').pop(),
      },
    };
  }
  return { rota: 'sendText', corpoEnvio: { number: String(destino), text: texto } };
}
