import { describe, it, expect } from 'vitest';
import {
  ALL_SECTION_IDS, chosenSections, isSectionId, sectionHasContent, SITE_SECTIONS, visibleSections,
  moveSection,
  sectionLabel,
} from './siteSections';
import { CurriculumItem, FaqItem, PhotoItem, ServiceItem, TestimonialItem, VideoItem } from '../types';

const vazio = {
  curriculum: [] as CurriculumItem[],
  services: [] as ServiceItem[],
  videos: [] as VideoItem[],
  photos: [] as PhotoItem[],
  testimonials: [] as TestimonialItem[],
  faqs: [] as FaqItem[],
};

const servico = (over: Partial<ServiceItem> = {}): ServiceItem => ({
  id: 's1', name: 'Aula', description: '', price: 100, durationMinutes: 60,
  active: true, modality: 'Presencial', iconName: 'pool', ...over,
});

const video = (over: Partial<VideoItem> = {}): VideoItem => ({
  id: 'v1', title: 'Aula', category: 'Aulas', videoUrl: 'x', thumbnailUrl: 'y',
  duration: '10:00', description: '', ...over,
});

const cheio = {
  curriculum: [{ id: 'c1', title: 'Formação', institution: '', period: '', category: 'education', description: '' } as CurriculumItem],
  services: [servico()],
  videos: [video()],
  photos: [{ id: 'p1', title: 'Foto', category: 'aulas', imageUrl: 'x', caption: '' } as PhotoItem],
  testimonials: [{ id: 't1', studentName: 'Ana', roleOrCourse: '', avatarUrl: '', rating: 5, content: '', date: '', verified: true } as TestimonialItem],
  faqs: [{ id: 'f1', question: 'Q', answer: 'A' } as FaqItem],
};

describe('escolha das seções do site', () => {
  it('quem nunca escolheu fica com todas: campo novo não tira seção de ninguém', () => {
    expect(chosenSections(undefined)).toEqual(ALL_SECTION_IDS);
    expect(chosenSections(null)).toEqual(ALL_SECTION_IDS);
  });

  it('escolher poucas guarda só essas', () => {
    expect(chosenSections(['servicos', 'faq'])).toEqual(['inicio', 'servicos', 'faq']);
  });

  it('Início entra sempre, mesmo se desmarcado: é a apresentação', () => {
    expect(chosenSections([])).toEqual(['inicio']);
    expect(chosenSections(['videos'])[0]).toBe('inicio');
  });

  it('a ordem salva É a ordem da página: quem move, move de verdade', () => {
    expect(chosenSections(['faq', 'curriculo', 'servicos']))
      .toEqual(['inicio', 'faq', 'curriculo', 'servicos']);
  });

  it('repetição no que foi salvo não duplica a seção', () => {
    expect(chosenSections(['servicos', 'servicos', 'faq'])).toEqual(['inicio', 'servicos', 'faq']);
  });

  it('valor inválido gravado no banco é ignorado, não quebra a página', () => {
    expect(chosenSections(['servicos', 'secao-que-nao-existe'])).toEqual(['inicio', 'servicos']);
    expect(isSectionId('galeria')).toBe(true);
    expect(isSectionId('qualquer')).toBe(false);
  });
});

describe('seção sem conteúdo não aparece', () => {
  it('site recém-criado mostra só o Início', () => {
    // Um link levando a um trecho em branco é pior do que não ter o link
    expect(visibleSections(undefined, vazio)).toEqual(['inicio']);
  });

  it('com conteúdo em tudo, aparecem todas', () => {
    expect(visibleSections(undefined, cheio)).toEqual(ALL_SECTION_IDS);
  });

  it('serviço inativo não conta como conteúdo', () => {
    expect(sectionHasContent('servicos', { ...vazio, services: [servico({ active: false })] })).toBe(false);
    expect(sectionHasContent('servicos', { ...vazio, services: [servico()] })).toBe(true);
  });

  it('vídeo inativo não conta, mas vídeo sem o campo conta', () => {
    expect(sectionHasContent('videos', { ...vazio, videos: [video({ active: false })] })).toBe(false);
    // Cadastros antigos não têm o campo: tratá-los como ocultos sumiria com o site
    expect(sectionHasContent('videos', { ...vazio, videos: [video({ active: undefined })] })).toBe(true);
  });

  it('a escolha do professor e o conteúdo se somam: precisa dos dois', () => {
    // Escolheu galeria, mas não tem foto
    expect(visibleSections(['galeria'], vazio)).toEqual(['inicio']);
    // Tem foto, mas não escolheu galeria
    expect(visibleSections(['servicos'], cheio)).toEqual(['inicio', 'servicos']);
  });
});

describe('definição das seções', () => {
  it('toda seção da lista tem rótulo de menu e de rodapé', () => {
    for (const s of SITE_SECTIONS) {
      expect(s.menuLabel.length).toBeGreaterThan(0);
      expect(s.shortLabel.length).toBeGreaterThan(0);
    }
  });

  it('só o Início é obrigatório', () => {
    expect(SITE_SECTIONS.filter((s) => s.alwaysOn).map((s) => s.id)).toEqual(['inicio']);
  });
});

describe('reordenar as seções', () => {
  const ordem = ['inicio', 'curriculo', 'servicos', 'faq'] as const;

  it('sobe e desce uma posição', () => {
    expect(moveSection([...ordem], 'servicos', 'cima')).toEqual(['inicio', 'servicos', 'curriculo', 'faq']);
    expect(moveSection([...ordem], 'curriculo', 'baixo')).toEqual(['inicio', 'servicos', 'curriculo', 'faq']);
  });

  it('nada ultrapassa o Início, que é a apresentação', () => {
    expect(moveSection([...ordem], 'curriculo', 'cima')).toEqual(ordem);
    expect(moveSection([...ordem], 'inicio', 'baixo')).toEqual(ordem);
  });

  it('a última não desce, e seção de fora não mexe em nada', () => {
    expect(moveSection([...ordem], 'faq', 'baixo')).toEqual(ordem);
    expect(moveSection([...ordem], 'galeria', 'cima')).toEqual(ordem);
  });

  it('não muda a lista recebida no lugar', () => {
    const original = [...ordem];
    moveSection(original, 'servicos', 'cima');
    expect(original).toEqual(ordem);
  });
});

describe('renomear os itens do menu', () => {
  it('sem troca, vale o nome padrão', () => {
    expect(sectionLabel('servicos')).toBe('Aulas & Serviços');
    expect(sectionLabel('servicos', {})).toBe('Aulas & Serviços');
  });

  it('o nome do professor vence o padrão', () => {
    expect(sectionLabel('servicos', { servicos: 'Modalidades' })).toBe('Modalidades');
  });

  it('nome em branco cai no padrão: item de menu sem texto é item invisível', () => {
    expect(sectionLabel('servicos', { servicos: '   ' })).toBe('Aulas & Serviços');
  });

  it('o rodapé usa o nome curto, e também aceita troca', () => {
    expect(sectionLabel('curriculo', undefined, 'shortLabel')).toBe('Currículo');
    expect(sectionLabel('curriculo', { curriculo: 'Formação' }, 'shortLabel')).toBe('Formação');
  });
});
