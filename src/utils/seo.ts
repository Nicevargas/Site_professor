/**
 * As etiquetas que buscador e WhatsApp leem, num lugar só.
 *
 * Antes cada tela escrevia direto no <head> com um querySelector que só sabia
 * ATUALIZAR: tag ausente do index.html era silenciosamente ignorada. Por isso
 * o canonical e o cartão do Twitter nunca mudavam -- toda vitrine
 * compartilhada anunciava o texto fixo do HTML.
 *
 * Aqui as tags são criadas quando faltam, e cada página declara o conjunto
 * inteiro de uma vez. Assim não sobra etiqueta da página anterior: numa SPA,
 * quem não escreve um valor herda o de quem passou antes.
 */

export interface SeoDados {
  titulo: string;
  descricao: string;
  /** Endereço público desta página. Vira canonical e og:url. */
  url?: string;
  imagem?: string;
  /** 'website' para páginas, 'profile' para a vitrine de uma pessoa */
  tipo?: 'website' | 'profile';
  /** Telas internas (painel, login) não pertencem ao índice de busca */
  indexavel?: boolean;
  /** Dados estruturados schema.org, já como objeto */
  estrutura?: Record<string, unknown> | null;
}

const ID_ESTRUTURA = 'aquagenda-jsonld';

function tagMeta(chave: 'name' | 'property', valor: string, conteudo: string): void {
  const seletor = `meta[${chave}="${valor}"]`;
  let el = document.head.querySelector(seletor);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(chave, valor);
    document.head.appendChild(el);
  }
  el.setAttribute('content', conteudo);
}

function tagCanonical(url: string): void {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

/**
 * Dados estruturados: um bloco só, sempre substituído.
 *
 * Acumular blocos faria a página dizer que é um professor E uma academia E um
 * software -- e o buscador escolheria sozinho em qual acreditar.
 */
function tagEstrutura(dados: Record<string, unknown> | null | undefined): void {
  const existente = document.getElementById(ID_ESTRUTURA);
  if (!dados) {
    existente?.remove();
    return;
  }
  const el = existente || document.createElement('script');
  el.id = ID_ESTRUTURA;
  el.setAttribute('type', 'application/ld+json');
  el.textContent = JSON.stringify(dados);
  if (!existente) document.head.appendChild(el);
}

/** Corta no limite que o buscador mostra, sem partir palavra ao meio. */
export function resumir(texto: string, limite = 155): string {
  const limpo = texto.replace(/\s+/g, ' ').trim();
  if (limpo.length <= limite) return limpo;
  const corte = limpo.slice(0, limite);
  return corte.slice(0, corte.lastIndexOf(' ')).trimEnd() + '…';
}

export function aplicarSeo(dados: SeoDados): void {
  const {
    titulo,
    descricao,
    url,
    imagem,
    tipo = 'website',
    indexavel = true,
    estrutura = null,
  } = dados;

  const resumo = resumir(descricao);

  document.title = titulo;
  tagMeta('name', 'description', resumo);

  // Painel e login fora do índice: são telas de quem já é cliente, e aparecer
  // na busca só geraria visita que bate numa porta fechada.
  tagMeta(
    'name',
    'robots',
    indexavel
      ? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
      : 'noindex, nofollow'
  );

  tagMeta('property', 'og:type', tipo);
  tagMeta('property', 'og:title', titulo);
  tagMeta('property', 'og:description', resumo);
  tagMeta('name', 'twitter:card', imagem ? 'summary_large_image' : 'summary');
  tagMeta('name', 'twitter:title', titulo);
  tagMeta('name', 'twitter:description', resumo);

  if (url) {
    tagCanonical(url);
    tagMeta('property', 'og:url', url);
  }

  if (imagem) {
    tagMeta('property', 'og:image', imagem);
    tagMeta('name', 'twitter:image', imagem);
  }

  tagEstrutura(indexavel ? estrutura : null);
}

// ====================================================================
// Dados estruturados por tipo de página
// ====================================================================

/** A plataforma: um software com preço, que é o que o buscador sabe exibir. */
export function estruturaPlataforma(
  url: string,
  planos: { name: string; priceMonth: number }[]
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Aquagenda',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url,
    description:
      'Sistema de agenda, alunos, pagamentos e site próprio para professores, estúdios e academias.',
    inLanguage: 'pt-BR',
    offers: planos.map((p) => ({
      '@type': 'Offer',
      name: p.name,
      price: p.priceMonth,
      priceCurrency: 'BRL',
      category: 'subscription',
    })),
  };
}

/**
 * A vitrine de um professor.
 *
 * Person e não LocalBusiness: quem procura procura a pessoa, e o professor
 * autônomo raramente tem endereço físico próprio para declarar.
 */
export function estruturaProfessor(dados: {
  nome: string;
  descricao: string;
  url: string;
  imagem?: string;
  especialidade?: string;
  telefone?: string;
}): Record<string, unknown> {
  const { nome, descricao, url, imagem, especialidade, telefone } = dados;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: nome,
    description: resumir(descricao, 300),
    url,
    ...(imagem ? { image: imagem } : {}),
    ...(especialidade ? { jobTitle: especialidade } : {}),
    ...(telefone ? { telephone: telefone } : {}),
    knowsLanguage: 'pt-BR',
  };
}

/** A página de uma academia: aqui LocalBusiness cabe, porque há um lugar. */
export function estruturaAcademia(dados: {
  nome: string;
  descricao: string;
  url: string;
  imagem?: string;
  telefone?: string;
}): Record<string, unknown> {
  const { nome, descricao, url, imagem, telefone } = dados;
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: nome,
    description: resumir(descricao, 300),
    url,
    ...(imagem ? { image: imagem } : {}),
    ...(telefone ? { telephone: telefone } : {}),
    areaServed: 'BR',
  };
}
