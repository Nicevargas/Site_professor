import { VideoItem } from '../../types';

/** Tipos de conteúdo multimídia da vitrine. */
export type VideoMediaType = 'podcast' | 'curso_online' | 'institucional' | 'vendas';

export const VIDEO_TYPE_LABELS: Record<VideoMediaType, string> = {
  podcast: 'Podcast',
  curso_online: 'Curso Online',
  institucional: 'Vídeo Institucional',
  vendas: 'Vídeo de Vendas',
};

/** Tipo efetivo de um item, cobrindo registros antigos sem mediaType ou com 'videoaula'. */
export function resolveVideoType(item: Pick<VideoItem, 'mediaType' | 'category'>): VideoMediaType {
  if (item.mediaType === 'podcast') return 'podcast';
  if (item.mediaType === 'vendas') return 'vendas';
  if (item.mediaType === 'curso_online' || item.mediaType === 'videoaula') return 'curso_online';
  if (item.mediaType === 'institucional') return 'institucional';
  const c = (item.category || '').toLowerCase();
  if (c.includes('podcast')) return 'podcast';
  if (c.includes('venda') || c.includes('oferta')) return 'vendas';
  if (c.includes('aula')) return 'curso_online';
  return 'institucional';
}

// Sugestões de categoria por tipo de conteúdo (a categoria continua livre para digitar)
export const VIDEO_CATEGORY_PRESETS: Record<'podcast' | 'curso_online' | 'institucional' | 'vendas', string[]> = {
  podcast: ['Entrevistas & Debates', 'Bate-papo com Alunos', 'Dicas Rápidas', 'Bastidores'],
  curso_online: ['Aulas & Didática', 'Treino & Performance', 'Resolução de Exercícios', 'Módulo Introdutório'],
  institucional: ['Metodologia & Apresentação', 'Infraestrutura & Espaço', 'Depoimentos & Prova Social', 'Boas-vindas'],
  vendas: ['Lançamentos & Ofertas', 'Matrículas Abertas', 'Planos & Pacotes', 'Mentoria Exclusiva'],
};

export const presetVideoThumbnails = {
  institucional: [
    { label: 'Apresentação & Metodologia', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80' },
    { label: 'Tour pelo Espaço & Estúdio', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80' },
    { label: 'Boas-Vindas & Resultados', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80' },
  ],
  curso_online: [
    { label: 'Curso / Aula Didática', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80' },
    { label: 'Resolução de Questões', url: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&auto=format&fit=crop&q=80' },
    { label: 'Material & Quadro Digital', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80' },
  ],
  videoaula: [
    { label: 'Curso / Aula Didática', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80' },
    { label: 'Resolução de Questões', url: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&auto=format&fit=crop&q=80' },
    { label: 'Material & Quadro Digital', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80' },
  ],
  podcast: [
    { label: 'Microfone de Estúdio', url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80' },
    { label: 'Entrevista / Fones', url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80' },
    { label: 'Mesa de Áudio & Podcast', url: 'https://images.unsplash.com/photo-1589903102058-aebd6ac8990d?w=800&auto=format&fit=crop&q=80' },
  ],
  vendas: [
    { label: 'Apresentação de Oferta & Planos', url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80' },
    { label: 'Matrículas & Inscrições Abertas', url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=80' },
    { label: 'Mentoria Exclusiva & Vagas', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80' },
  ]
};

// ---------------- VIDEO, CURSO & PODCAST HANDLERS ----------------
