import { describe, it, expect } from 'vitest';
import { camposAlterados } from './camposAlterados';

describe('só os campos que a pessoa mudou', () => {
  it('devolve apenas o que mudou', () => {
    const inicial = { nome: 'Ana', bio: 'antiga', whatsapp: '11988887777' };
    const atual = { nome: 'Ana', bio: 'nova', whatsapp: '11988887777' };
    expect(camposAlterados(inicial, atual)).toEqual({ bio: 'nova' });
  });

  it('nada mudou, nada é devolvido', () => {
    const dados = { nome: 'Ana', cor: '#00687a' };
    expect(camposAlterados(dados, { ...dados })).toEqual({});
  });

  it('objeto remontado com o mesmo conteúdo não conta como mudança', () => {
    // O modo férias é montado de novo a cada render; o conteúdo é o que importa
    const inicial = { ferias: { ligado: false, titulo: 'Recesso' } };
    const atual = { ferias: { ligado: false, titulo: 'Recesso' } };
    expect(camposAlterados(inicial, atual)).toEqual({});
    expect(camposAlterados(inicial, { ferias: { ligado: true, titulo: 'Recesso' } }))
      .toEqual({ ferias: { ligado: true, titulo: 'Recesso' } });
  });

  it('apagar um campo de propósito é mudança, e vai para o banco', () => {
    expect(camposAlterados({ logo: 'https://x/logo.png' }, { logo: '' })).toEqual({ logo: '' });
  });

  it('campo que nunca existiu e continua sem valor não é gravado', () => {
    // Era assim que o salvar escrevia vazio por cima de dado real
    expect(camposAlterados({ logo: undefined }, { logo: undefined })).toEqual({});
  });
});
