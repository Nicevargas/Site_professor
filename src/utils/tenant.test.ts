import { describe, it, expect } from 'vitest';
import { resolveTenant, slugFromRoute, slugify, ensureUniqueSlug, buildPublicUrl } from './tenant';

const HOST = 'aquagenda.com.br';
const loc = (hostname: string, pathname = '/', hash = '') => ({ hostname, pathname, hash });

describe('identificador a partir do nome', () => {
  it('remove títulos, acentos e pontuação', () => {
    expect(slugify('Prof. Roberto Almeida')).toBe('roberto-almeida');
    expect(slugify('Profa. Ana Conceição')).toBe('ana-conceicao');
    expect(slugify('Dr. José Antônio Kühn')).toBe('jose-antonio-kuhn');
    expect(slugify('  Carlos   Silva  ')).toBe('carlos-silva');
  });

  it('não deixa hífen sobrando nem texto vazio virar endereço', () => {
    expect(slugify('!!!')).toBe('');
    expect(slugify('')).toBe('');
    expect(slugify('Maria & João')).toBe('maria-joao');
  });

  it('resolve repetição acrescentando número', () => {
    expect(ensureUniqueSlug('Prof. Carlos Silva', [])).toBe('carlos-silva');
    expect(ensureUniqueSlug('Prof. Carlos Silva', ['carlos-silva'])).toBe('carlos-silva-2');
    expect(ensureUniqueSlug('Prof. Carlos Silva', ['carlos-silva', 'carlos-silva-2'])).toBe('carlos-silva-3');
    expect(ensureUniqueSlug('!!!', ['professor'])).toBe('professor-2');
  });
});

describe('resolução do endereço', () => {
  it('lê o identificador do caminho e do hash', () => {
    expect(slugFromRoute('/p/roberto-almeida', '')).toEqual({ slug: 'roberto-almeida', kind: 'professor' });
    expect(slugFromRoute('/', '#/p/roberto-almeida')).toEqual({ slug: 'roberto-almeida', kind: 'professor' });
    expect(slugFromRoute('/p/Roberto', '')).toEqual({ slug: 'roberto', kind: 'professor' });
    // /e/ é a academia
    expect(slugFromRoute('/e/aqua-vida', '')).toEqual({ slug: 'aqua-vida', kind: 'empresa' });
    expect(slugFromRoute('/', '#/e/aqua-vida')).toEqual({ slug: 'aqua-vida', kind: 'empresa' });
    expect(slugFromRoute('/', '#/agenda')).toBeNull();
    expect(slugFromRoute('/', '')).toBeNull();
  });

  it('caminho funciona no domínio da plataforma', () => {
    expect(resolveTenant(loc(HOST, '/p/roberto-almeida'), HOST)).toEqual({ mode: 'path', kind: 'professor', slug: 'roberto-almeida' });
    expect(resolveTenant(loc(`www.${HOST}`, '/', '#/p/carlos'), HOST)).toEqual({ mode: 'path', kind: 'professor', slug: 'carlos' });
  });

  it('subdomínio de um nível vira professor', () => {
    expect(resolveTenant(loc(`roberto-almeida.${HOST}`), HOST)).toEqual({ mode: 'subdomain', kind: 'indefinido', slug: 'roberto-almeida' });
  });

  it('subdomínios reservados não são professores', () => {
    for (const reserved of ['www', 'app', 'api', 'painel']) {
      expect(resolveTenant(loc(`${reserved}.${HOST}`), HOST).mode).not.toBe('subdomain');
    }
  });

  it('dois níveis não contam, porque o certificado curinga não cobre', () => {
    expect(resolveTenant(loc(`a.b.${HOST}`), HOST).mode).toBe('none');
  });

  it('domínio de fora é tratado como domínio próprio', () => {
    expect(resolveTenant(loc('profrobertoalmeida.com.br'), HOST)).toEqual({
      mode: 'domain',
      kind: 'indefinido',
      domain: 'profrobertoalmeida.com.br',
    });
  });

  it('desenvolvimento e prévia não viram domínio de professor', () => {
    expect(resolveTenant(loc('localhost', '/'), HOST).mode).toBe('none');
    expect(resolveTenant(loc('aquagenda.vercel.app', '/'), HOST).mode).toBe('none');
    // mas o caminho continua funcionando no ambiente local
    expect(resolveTenant(loc('localhost', '/', '#/p/carlos'), HOST)).toEqual({ mode: 'path', kind: 'professor', slug: 'carlos' });
  });

  it('sem domínio de plataforma configurado, só o caminho resolve', () => {
    expect(resolveTenant(loc('qualquer.coisa.com', '/'), '').mode).toBe('none');
    expect(resolveTenant(loc('qualquer.coisa.com', '/p/ana'), '')).toEqual({ mode: 'path', kind: 'professor', slug: 'ana' });
  });

  it('o endereço mais específico ganha do mais genérico', () => {
    // subdomínio presente e caminho presente: vence o subdomínio
    expect(resolveTenant(loc(`roberto.${HOST}`, '/p/carlos'), HOST)).toEqual({ mode: 'subdomain', kind: 'indefinido', slug: 'roberto' });
  });
});

describe('endereço público', () => {
  it('monta a URL conforme o modo liberado', () => {
    expect(buildPublicUrl('path', { slug: 'roberto', platformHost: HOST })).toBe('https://aquagenda.com.br/p/roberto');
    expect(buildPublicUrl('subdomain', { slug: 'roberto', platformHost: HOST })).toBe('https://roberto.aquagenda.com.br');
    expect(buildPublicUrl('domain', { domain: 'profroberto.com.br', platformHost: HOST })).toBe('https://profroberto.com.br');
  });

  it('sem domínio informado, o modo domínio cai para o caminho', () => {
    expect(buildPublicUrl('domain', { slug: 'roberto', platformHost: HOST })).toBe('https://aquagenda.com.br/p/roberto');
  });
});

describe('vitrine da academia', () => {
  it('o caminho diz de quem é: /p/ professor, /e/ academia', () => {
    expect(resolveTenant(loc(HOST, '/e/aqua-vida'), HOST)).toEqual({
      mode: 'path', kind: 'empresa', slug: 'aqua-vida',
    });
  });

  it('subdomínio e domínio próprio ficam indefinidos: quem decide é a consulta', () => {
    // Academia e professor dividem esse espaço; o banco garante que o
    // endereço não pertence aos dois, e a consulta descobre qual é.
    expect(resolveTenant(loc(`aqua-vida.${HOST}`), HOST).kind).toBe('indefinido');
    expect(resolveTenant(loc('academiaaquavida.com.br'), HOST).kind).toBe('indefinido');
  });

  it('monta o endereço da academia com /e/', () => {
    expect(buildPublicUrl('path', { slug: 'aqua-vida', kind: 'empresa', platformHost: HOST }))
      .toBe(`https://${HOST}/e/aqua-vida`);
    // Sem informar, continua sendo professor -- não quebra quem já chamava
    expect(buildPublicUrl('path', { slug: 'roberto', platformHost: HOST }))
      .toBe(`https://${HOST}/p/roberto`);
  });

  it('subdomínio e domínio próprio não mudam de forma por causa do tipo', () => {
    expect(buildPublicUrl('subdomain', { slug: 'aqua-vida', kind: 'empresa', platformHost: HOST }))
      .toBe(`https://aqua-vida.${HOST}`);
    expect(buildPublicUrl('domain', { domain: 'academiaaquavida.com.br', kind: 'empresa' }))
      .toBe('https://academiaaquavida.com.br');
  });
});
