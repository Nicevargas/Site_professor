import { describe, it, expect } from 'vitest';
import { crc16, gerarPixCopiaECola, normalizarChavePix, pixDaCobranca } from './pix';

describe('Pix Copia e Cola', () => {
  it('CRC16 confere com o valor de referência do CCITT-FALSE', () => {
    // "123456789" -> 0x29B1 é o vetor de teste clássico deste CRC
    expect(crc16('123456789')).toBe('29B1');
  });

  it('gera o código do exemplo do manual do BR Code do Banco Central', () => {
    const codigo = gerarPixCopiaECola({
      chave: '123e4567-e12b-12d1-a456-426655440000',
      tipo: 'random',
      recebedor: 'Fulano de Tal',
      cidade: 'BRASILIA',
    });
    // Exemplo publicado no Manual do BR Code, com o CRC 1D3D
    expect(codigo).toBe(
      '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000'
        + '5204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D'
    );
  });

  it('tamanho de cada campo acompanha o conteúdo, e o valor vai com 2 casas', () => {
    const codigo = gerarPixCopiaECola({ chave: 'a@b.co', tipo: 'email', recebedor: 'Ana', valor: 180 });
    expect(codigo).toContain('0014br.gov.bcb.pix0106a@b.co');
    expect(codigo).toContain('5406180.00');
    expect(codigo).toContain('5903Ana');
    expect(codigo).not.toContain('XYZ');
    expect(codigo.slice(-8, -4)).toBe('6304');
    expect(codigo.slice(-4)).toBe(crc16(codigo.slice(0, -4)));
  });

  it('nome com acento sai sem acento e com no máximo 25 letras', () => {
    const codigo = gerarPixCopiaECola({ chave: '12345678901', tipo: 'cpf', recebedor: 'João Conceição da Silva Araújo' });
    expect(codigo).toContain('5925Joao Conceicao da Silva ');
  });

  it('celular digitado com máscara vira +55DDD...', () => {
    expect(normalizarChavePix('(11) 98888-7777', 'phone')).toBe('+5511988887777');
    expect(normalizarChavePix('5511988887777', 'phone')).toBe('+5511988887777');
    expect(normalizarChavePix('123.456.789-01', 'cpf')).toBe('12345678901');
    expect(normalizarChavePix(' Prof@Email.com ', 'email')).toBe('prof@email.com');
  });

  it('professor sem chave Pix não ganha código inventado', () => {
    expect(pixDaCobranca({ name: 'Ana', pixKey: '' }, 100)).toBe('');
    expect(pixDaCobranca({ name: 'Ana', pixKey: undefined }, 100)).toBe('');
  });
});
