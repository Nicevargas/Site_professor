import { describe, it, expect } from 'vitest';
import {
  ALL_SECTION_IDS, chosenSections, isSectionId, sectionHasContent, SITE_SECTIONS, visibleSections,
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

  it('a ordem é a da página, não a ordem em que foi salvo', () => {
    expect(chosenSections(['faq', 'curriculo', 'servicos']))
      .toEqual(['inicio', 'curriculo', 'servicos', 'faq']);
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
