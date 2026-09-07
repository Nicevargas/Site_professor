import { CurriculumItem, FaqItem, PhotoItem, ServiceItem, TestimonialItem, VideoItem } from '../types';

/**
 * Seções da vitrine do professor.
 *
 * Uma lista só governa o menu do topo, o rodapé e o que a página desenha --
 * antes o menu era fixo no código e apontava para seções que podiam estar
 * vazias, levando o visitante a um trecho em branco.
 */

export type SiteSectionId =
  | 'inicio'
  | 'curriculo'
  | 'servicos'
  | 'videos'
  | 'galeria'
  | 'depoimentos'
  | 'faq';

export interface SiteSectionDef {
  id: SiteSectionId;
  /** Como aparece no menu do topo */
  menuLabel: string;
  /** Nome curto, para o rodapé e para a tela de configuração */
  shortLabel: string;
  /** O que o professor precisa cadastrar para ela fazer sentido */
  needs: string;
  /** Início é a apresentação: existe sempre, e não pode ser desligada */
  alwaysOn?: boolean;
}

export const SITE_SECTIONS: SiteSectionDef[] = [
  { id: 'inicio', menuLabel: 'Início', shortLabel: 'Início', needs: 'Sua apresentação', alwaysOn: true },
  { id: 'curriculo', menuLabel: 'Currículo & Títulos', shortLabel: 'Currículo', needs: 'Itens de currículo' },
  { id: 'servicos', menuLabel: 'Aulas & Serviços', shortLabel: 'Aulas', needs: 'Serviços ativos' },
  { id: 'videos', menuLabel: 'Vídeos & Aulas', shortLabel: 'Vídeos', needs: 'Vídeos publicados' },
  { id: 'galeria', menuLabel: 'Galeria', shortLabel: 'Galeria', needs: 'Fotos' },
  { id: 'depoimentos', menuLabel: 'Depoimentos', shortLabel: 'Depoimentos', needs: 'Depoimentos' },
  { id: 'faq', menuLabel: 'Dúvidas (FAQ)', shortLabel: 'Dúvidas', needs: 'Perguntas frequentes' },
];

export const ALL_SECTION_IDS: SiteSectionId[] = SITE_SECTIONS.map((s) => s.id);

export function isSectionId(value: unknown): value is SiteSectionId {
  return typeof value === 'string' && ALL_SECTION_IDS.includes(value as SiteSectionId);
}

/** Conteúdo disponível para decidir se uma seção tem o que mostrar. */
export interface SiteContent {
  curriculum: CurriculumItem[];
  services: ServiceItem[];
  videos: VideoItem[];
  photos: PhotoItem[];
  testimonials: TestimonialItem[];
  faqs: FaqItem[];
}

/** A seção tem conteúdo para exibir? Início não depende de cadastro. */
export function sectionHasContent(id: SiteSectionId, content: SiteContent): boolean {
  switch (id) {
    case 'inicio': return true;
    case 'curriculo': return content.curriculum.length > 0;
    case 'servicos': return content.services.some((s) => s.active);
    case 'videos': return content.videos.some((v) => v.active !== false);
    case 'galeria': return content.photos.length > 0;
    case 'depoimentos': return content.testimonials.length > 0;
    case 'faq': return content.faqs.length > 0;
    default: return false;
  }
}

/**
 * Seções escolhidas pelo professor, na ordem em que ele quer que apareçam.
 *
 * A ordem gravada É a ordem da página: quem move Depoimentos para cima quer
 * ver os depoimentos antes. Sem escolha gravada valem todas, na ordem padrão
 * -- ninguém perde seção nem ordem por causa de um campo novo.
 *
 * 'inicio' é a apresentação e fica sempre em primeiro, venha como vier.
 */
export function chosenSections(saved?: string[] | null): SiteSectionId[] {
  if (!saved) return ALL_SECTION_IDS;

  const vistas = new Set<SiteSectionId>();
  const ordenadas: SiteSectionId[] = [];
  for (const item of saved) {
    if (!isSectionId(item) || item === 'inicio' || vistas.has(item)) continue;
    vistas.add(item);
    ordenadas.push(item);
  }
  return ['inicio', ...ordenadas];
}

/**
 * Nome que aparece no menu: o do professor, quando ele trocou, ou o padrão.
 * Rótulo em branco cai no padrão -- item de menu sem texto é item invisível.
 */
export function sectionLabel(
  id: SiteSectionId,
  overrides?: Record<string, string> | null,
  field: 'menuLabel' | 'shortLabel' = 'menuLabel'
): string {
  const padrao = SITE_SECTIONS.find((s) => s.id === id);
  const custom = (overrides?.[id] || '').trim();
  return custom || padrao?.[field] || id;
}

/** Move uma seção uma posição para cima ou para baixo. 'inicio' não sai do topo. */
export function moveSection(
  ordem: SiteSectionId[],
  id: SiteSectionId,
  direcao: 'cima' | 'baixo'
): SiteSectionId[] {
  if (id === 'inicio') return ordem;
  const i = ordem.indexOf(id);
  if (i === -1) return ordem;

  const destino = direcao === 'cima' ? i - 1 : i + 1;
  // Não passa do fim, nem ultrapassa o 'inicio' que fica em 0
  if (destino < 1 || destino >= ordem.length) return ordem;

  const proxima = [...ordem];
  [proxima[i], proxima[destino]] = [proxima[destino], proxima[i]];
  return proxima;
}

/**
 * O que o menu e a página realmente mostram: escolhida pelo professor E com
 * conteúdo. Um link para uma seção vazia é pior do que não ter o link.
 */
export function visibleSections(saved: string[] | null | undefined, content: SiteContent): SiteSectionId[] {
  // Preserva a ordem escolhida: filtrar não pode reordenar
  return chosenSections(saved).filter((id) => sectionHasContent(id, content));
}
