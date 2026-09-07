import { describe, it, expect, beforeEach } from 'vitest';
import { aplicarSeo, estruturaProfessor, resumir } from './seo';

const conteudo = (seletor: string) =>
  document.head.querySelector(seletor)?.getAttribute('content');

const estrutura = () => {
  const el = document.getElementById('aquagenda-jsonld');
  return el ? JSON.parse(el.textContent || '{}') : null;
};

beforeEach(() => {
  document.head.innerHTML = '';
  document.title = '';
});

describe('etiquetas de busca e compartilhamento', () => {
  it('cria as tags que faltam: era por isso que canonical e Twitter nunca mudavam', () => {
    // O <head> começa vazio de propósito -- o código antigo só sabia atualizar
    // tag existente, e falhava calado quando ela não estava no index.html
    aplicarSeo({ titulo: 'Ana', descricao: 'Aulas de natação', url: 'https://ana.exemplo.com/' });

    expect(document.title).toBe('Ana');
    expect(conteudo('meta[name="description"]')).toBe('Aulas de natação');
    expect(conteudo('meta[name="twitter:title"]')).toBe('Ana');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://ana.exemplo.com/');
  });

  it('não duplica tag ao trocar de página', () => {
    aplicarSeo({ titulo: 'Ana', descricao: 'Uma' });
    aplicarSeo({ titulo: 'Bruno', descricao: 'Outra' });

    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(conteudo('meta[name="description"]')).toBe('Outra');
  });

  it('tela interna sai do índice, e leva os dados estruturados junto', () => {
    aplicarSeo({
      titulo: 'Painel',
      descricao: 'Área do sistema',
      indexavel: false,
      estrutura: { '@type': 'Person' },
    });

    expect(conteudo('meta[name="robots"]')).toBe('noindex, nofollow');
    // Declarar um professor na tela do painel diria ao buscador que aquela
    // página é a vitrine dele
    expect(estrutura()).toBeNull();
  });

  it('só um bloco de dados estruturados: dois fariam a página dizer que é duas coisas', () => {
    aplicarSeo({ titulo: 'A', descricao: 'a', estrutura: { '@type': 'Person', name: 'Ana' } });
    aplicarSeo({ titulo: 'B', descricao: 'b', estrutura: { '@type': 'SportsActivityLocation', name: 'Academia' } });

    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
    expect(estrutura()['@type']).toBe('SportsActivityLocation');
  });

  it('sem imagem, o cartão é pequeno: o grande deixaria um retângulo vazio', () => {
    aplicarSeo({ titulo: 'A', descricao: 'a' });
    expect(conteudo('meta[name="twitter:card"]')).toBe('summary');

    aplicarSeo({ titulo: 'A', descricao: 'a', imagem: 'https://x/y.jpg' });
    expect(conteudo('meta[name="twitter:card"]')).toBe('summary_large_image');
  });
});

describe('resumo da descrição', () => {
  it('texto curto passa inteiro', () => {
    expect(resumir('Aulas de natação')).toBe('Aulas de natação');
  });

  it('junta espaços e quebras: o buscador mostra numa linha só', () => {
    expect(resumir('Aulas  de\n natação')).toBe('Aulas de natação');
  });

  it('corta no limite sem partir palavra ao meio', () => {
    const resumo = resumir('palavra '.repeat(40), 50);
    expect(resumo.length).toBeLessThanOrEqual(51);
    expect(resumo.endsWith('…')).toBe(true);
    expect(resumo).not.toContain('palav…');
  });
});

describe('dados estruturados do professor', () => {
  it('descreve uma pessoa, com o endereço público dela', () => {
    const dados = estruturaProfessor({
      nome: 'Ana Lima',
      descricao: 'Professora de natação',
      url: 'https://ana.exemplo.com/',
      especialidade: 'Natação infantil',
    });
    expect(dados['@type']).toBe('Person');
    expect(dados.name).toBe('Ana Lima');
    expect(dados.jobTitle).toBe('Natação infantil');
  });

  it('campo vazio não vira chave vazia no JSON', () => {
    const dados = estruturaProfessor({ nome: 'Ana', descricao: 'x', url: 'https://x/' });
    expect('image' in dados).toBe(false);
    expect('telephone' in dados).toBe(false);
  });
});
