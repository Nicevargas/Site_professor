import { describe, it, expect } from 'vitest';
import { dataUrlKb } from './mediaAndTextHelpers';

describe('peso de uma imagem embutida', () => {
  it('converte base64 em KB aproximados', () => {
    // 4 caracteres de base64 valem 3 bytes; 1368 caracteres ≈ 1 KB
    const umKb = 'data:image/png;base64,' + 'A'.repeat(1368);
    expect(dataUrlKb(umKb)).toBe(1);
  });

  it('endereço na internet não tem peso embutido', () => {
    // Imagem no Storage é um endereço curto: o arquivo não viaja no banco
    expect(dataUrlKb('https://exemplo.com/foto.jpg')).toBe(0);
  });

  it('data URL vazio não quebra a conta', () => {
    expect(dataUrlKb('')).toBe(0);
    expect(dataUrlKb('data:image/png;base64,')).toBe(0);
  });
});
