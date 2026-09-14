import { describe, it, expect } from 'vitest';
import { lerLinkDeAcesso } from './linkDeAcesso';

describe('link que chega pelo e-mail', () => {
  it('link de redefinição de senha é reconhecido', () => {
    const hash = '#access_token=abc&expires_in=3600&refresh_token=def&token_type=bearer&type=recovery';
    expect(lerLinkDeAcesso(hash, '')).toEqual({ recuperacao: true, erro: null });
  });

  it('login normal, confirmação de cadastro ou rota do app não são redefinição', () => {
    expect(lerLinkDeAcesso('#access_token=abc&type=signup', '').recuperacao).toBe(false);
    expect(lerLinkDeAcesso('#/painel', '').recuperacao).toBe(false);
    expect(lerLinkDeAcesso('', '').recuperacao).toBe(false);
    // "type=recovery" sem sessão no endereço não abre a tela de senha
    expect(lerLinkDeAcesso('#type=recovery', '').recuperacao).toBe(false);
  });

  it('link vencido vira aviso em português', () => {
    const hash = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired';
    const link = lerLinkDeAcesso(hash, '');
    expect(link.recuperacao).toBe(false);
    expect(link.erro).toMatch(/link expirou/i);
  });

  it('erro também é lido quando vem na busca (?error=...)', () => {
    expect(lerLinkDeAcesso('', '?error=access_denied&error_description=Something').erro).toMatch(/não foi autorizado/i);
  });
});
