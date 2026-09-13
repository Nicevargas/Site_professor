import { describe, it, expect } from 'vitest';
import {
  detectarArea, ehSugestao, sugerirApresentacao, sugerirEspecialidade, TOTAL_VARIACOES,
  ServicoParaTexto,
} from './textoInicial';

const aula = (name: string, modality = 'Online / Presencial', active = true): ServicoParaTexto =>
  ({ name, modality, active });

// As aulas reais do Renato Simon, como estão no banco
const renato = {
  servicos: [
    aula('Cursos de Natação'),
    aula('Mentoria'),
    aula('Planilha com Treinos', 'Apenas Online'),
    aula('Aulas de Natação Infantil'),
  ],
};

describe('a área sai do nome das aulas', () => {
  it('natação ganha de "treinos" quando aparece mais vezes', () => {
    expect(detectarArea(renato.servicos).id).toBe('natacao');
  });

  it('reconhece a área sem depender de acento ou maiúscula', () => {
    expect(detectarArea([aula('PILATES solo')]).id).toBe('pilates');
    expect(detectarArea([aula('Aula de violao')]).id).toBe('musica');
    expect(detectarArea([aula('Reforço de Matemática')]).id).toBe('reforco');
  });

  it('aula desativada não conta', () => {
    expect(detectarArea([aula('Yoga', 'Online', false), aula('Muay Thai')]).id).toBe('luta');
  });

  it('sem pista nenhuma, fala de aulas particulares em vez de chutar uma área', () => {
    expect(detectarArea([]).id).toBe('geral');
    expect(detectarArea([aula('Mentoria')]).id).toBe('geral');
  });
});

describe('especialidade', () => {
  it('cabe no selo da vitrine, em qualquer área e formato', () => {
    // O selo é pequeno e em maiúsculas; frase comprida vira faixa ilegível.
    // Testar só natação escondeu que "Aulas particulares com atenção
    // individual" passava do limite.
    const exemplos = [
      'Natação', 'Pilates', 'Yoga', 'Dança', 'Muay Thai', 'Musculação',
      'Violão', 'Inglês', 'Reforço de Matemática', 'Mentoria', '',
    ];
    const formatos = ['Online / Presencial', 'Apenas Online', 'Presencial', ''];
    for (const nome of exemplos) {
      for (const modality of formatos) {
        const dados = { servicos: nome ? [aula(nome, modality)] : [] };
        for (let v = 0; v < TOTAL_VARIACOES; v++) {
          const selo = sugerirEspecialidade(dados, v);
          expect(selo.length, selo).toBeLessThanOrEqual(40);
        }
      }
    }
  });

  it('diz o formato quando as aulas dizem', () => {
    expect(sugerirEspecialidade(renato, 0)).toBe('Natação · Presencial e online');
    expect(sugerirEspecialidade({ servicos: [aula('Pilates', 'Presencial')] }, 0)).toBe('Pilates · Presencial');
  });

  it('as variações são diferentes entre si', () => {
    const textos = new Set([0, 1, 2].map((v) => sugerirEspecialidade(renato, v)));
    expect(textos.size).toBe(TOTAL_VARIACOES);
  });

  it('variação fora da faixa volta para dentro, sem quebrar', () => {
    expect(sugerirEspecialidade(renato, 3)).toBe(sugerirEspecialidade(renato, 0));
    expect(sugerirEspecialidade(renato, -1)).toBe(sugerirEspecialidade(renato, 2));
  });
});

describe('apresentação', () => {
  it('menciona a área, o formato e as aulas que existem', () => {
    const texto = sugerirApresentacao(renato, 0);
    expect(texto).toMatch(/natação/);
    expect(texto).toMatch(/presenciais e online/);
    expect(texto).toMatch(/Cursos de Natação, Mentoria e Planilha com Treinos/);
  });

  it('com uma aula só, não monta lista de uma', () => {
    const texto = sugerirApresentacao({ servicos: [aula('Pilates')] }, 0);
    expect(texto).not.toMatch(/Hoje ofereço/);
  });

  it('não inventa o que só o professor pode afirmar', () => {
    // Formação, tempo de carreira e resultados precisam vir da pessoa
    for (let v = 0; v < TOTAL_VARIACOES; v++) {
      const texto = sugerirApresentacao(renato, v);
      expect(texto).not.toMatch(/anos de experiência|formad[oa]|certificad|garant|especialista/i);
    }
  });

  it('não supõe o gênero de quem se apresenta', () => {
    for (let v = 0; v < TOTAL_VARIACOES; v++) {
      expect(sugerirApresentacao(renato, v)).not.toMatch(/\bprofessor[a]?\b|\bformad[oa]\b/i);
    }
  });

  it('funciona mesmo sem nenhuma aula cadastrada', () => {
    const texto = sugerirApresentacao({ servicos: [] }, 1);
    expect(texto).toMatch(/aulas particulares/);
    expect(texto).not.toMatch(/undefined|null/);
  });
});

describe('reconhecer uma sugestão intacta', () => {
  it('texto gerado é sugestão; texto editado deixa de ser', () => {
    const gerado = sugerirApresentacao(renato, 2);
    expect(ehSugestao(gerado, renato, 'apresentacao')).toBe(true);
    // A pessoa mexeu: nenhum botão pode trocar o que ela escreveu
    expect(ehSugestao(gerado + ' Atendo na zona sul.', renato, 'apresentacao')).toBe(false);
  });

  it('campo vazio não é sugestão', () => {
    expect(ehSugestao('', renato, 'especialidade')).toBe(false);
    expect(ehSugestao('   ', renato, 'especialidade')).toBe(false);
  });
});
