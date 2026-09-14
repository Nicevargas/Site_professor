import { describe, it, expect } from 'vitest';
import { ERRO_GERAL_DE_ACESSO, traduzirErroDeAcesso } from './erroDeAcesso';

describe('erros do Supabase em português', () => {
  it.each([
    ['Invalid login credentials', /e-mail ou senha incorretos/i],
    ['Email not confirmed', /ainda não foi confirmado/i],
    ['User already registered', /já tem cadastro/i],
    ['New password should be different from the old password.', /diferente da senha atual/i],
    ['Email rate limit exceeded', /muitos e-mails/i],
    ['Email link is invalid or has expired', /link expirou/i],
    ['Auth session missing!', /sessão terminou/i],
    ['Unable to validate email address: invalid format', /não parece válido/i],
    ['Password is known to be weak and easy to guess, please choose a different one.', /fácil de adivinhar/i],
    ['Failed to fetch', /sem conexão/i],
  ])('"%s"', (ingles, esperado) => {
    expect(traduzirErroDeAcesso(ingles)).toMatch(esperado);
  });

  it('usa o número que o servidor mandou', () => {
    expect(traduzirErroDeAcesso('Password should be at least 8 characters.')).toBe(
      'A senha precisa ter pelo menos 8 caracteres.'
    );
    expect(traduzirErroDeAcesso('For security purposes, you can only request this after 42 seconds.')).toBe(
      'Por segurança, espere 42 segundos antes de tentar de novo.'
    );
  });

  it('mensagem desconhecida não passa em inglês', () => {
    expect(traduzirErroDeAcesso('Something unexpected happened in GoTrue')).toBe(ERRO_GERAL_DE_ACESSO);
    expect(traduzirErroDeAcesso('')).toBe(ERRO_GERAL_DE_ACESSO);
    expect(traduzirErroDeAcesso(undefined)).toBe(ERRO_GERAL_DE_ACESSO);
  });
});
