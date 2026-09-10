import { describe, it, expect } from 'vitest';
import { linkWhatsapp, normalizarWhatsapp, temWhatsapp } from './whatsappLink';

describe('número do WhatsApp', () => {
  it('tira a máscara que o cadastro grava', () => {
    // Era isto que quebrava o link: "(11) 98888-7777" ia cru para a URL
    expect(normalizarWhatsapp('(11) 98888-7777')).toBe('5511988887777');
    expect(normalizarWhatsapp('11 98888-7777')).toBe('5511988887777');
  });

  it('não duplica o DDI de quem já salvou com 55', () => {
    expect(normalizarWhatsapp('5511988887777')).toBe('5511988887777');
    expect(normalizarWhatsapp('+55 (11) 98888-7777')).toBe('5511988887777');
  });

  it('aceita fixo com DDD, que tem um dígito a menos', () => {
    expect(normalizarWhatsapp('(11) 3888-7777')).toBe('551138887777');
  });

  it('vazio, nulo e lixo não viram número', () => {
    expect(normalizarWhatsapp('')).toBe('');
    expect(normalizarWhatsapp(null)).toBe('');
    expect(normalizarWhatsapp(undefined)).toBe('');
    expect(normalizarWhatsapp('sem número')).toBe('');
  });

  it('curto ou comprido demais é recusado, não remendado', () => {
    // 8 dígitos é telefone sem DDD: abrir conversa com isso dá erro no app
    expect(normalizarWhatsapp('98887777')).toBe('');
    expect(normalizarWhatsapp('5511988887777999')).toBe('');
  });
});

describe('link da conversa', () => {
  it('monta o endereço com a mensagem codificada', () => {
    expect(linkWhatsapp('(11) 98888-7777', 'Olá, tudo bem?'))
      .toBe('https://wa.me/5511988887777?text=Ol%C3%A1%2C%20tudo%20bem%3F');
  });

  it('sem mensagem, só a conversa', () => {
    expect(linkWhatsapp('11988887777')).toBe('https://wa.me/5511988887777');
  });

  it('sem número devolve null, para o botão sumir', () => {
    // https://wa.me/ abre o WhatsApp sem destinatário: o visitante acha que
    // falou com o professor e ninguém recebe nada
    expect(linkWhatsapp('')).toBeNull();
    expect(linkWhatsapp(null, 'oi')).toBeNull();
  });

  it('mensagem só de espaços não vira parâmetro vazio', () => {
    expect(linkWhatsapp('11988887777', '   ')).toBe('https://wa.me/5511988887777');
  });

  it('temWhatsapp responde o que o botão precisa saber', () => {
    expect(temWhatsapp('(11) 98888-7777')).toBe(true);
    expect(temWhatsapp('')).toBe(false);
    expect(temWhatsapp(null)).toBe(false);
  });
});
