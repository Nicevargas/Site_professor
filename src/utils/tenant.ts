import { AddressingMode } from './plans';

/**
 * Descobre de qual professor é a vitrine a partir do endereço.
 * É a peça que os três modelos compartilham: caminho, subdomínio e domínio próprio
 * entram todos por aqui, mudando só de onde o identificador é lido.
 */

/** Domínio da plataforma. Sem a variável de ambiente, o app roda como instalação única. */
export const PLATFORM_HOST = (
  ((import.meta as any).env?.VITE_PLATFORM_HOST as string) || ''
).trim().toLowerCase();

/** Subdomínios da plataforma que nunca são professores. */
const RESERVED_SUBDOMAINS = new Set([
  'www', 'app', 'api', 'admin', 'painel', 'auth', 'cdn', 'static', 'assets', 'mail', 'blog', 'docs',
]);

/** Hospedagens de desenvolvimento e prévia não representam domínio de professor. */
const NON_TENANT_HOSTS = /(^localhost$|^127\.|^0\.0\.0\.0$|^\[|\.local$|\.vercel\.app$|\.netlify\.app$|\.github\.io$)/;

export interface TenantRef {
  mode: AddressingMode | 'none';
  /** Identificador do professor, para caminho e subdomínio */
  slug?: string;
  /** Domínio informado pelo visitante, para domínio próprio */
  domain?: string;
}

const NONE: TenantRef = { mode: 'none' };

/** Extrai o identificador de "/p/<slug>" vindo do caminho ou do hash. */
export function slugFromRoute(pathname: string, hash: string): string | null {
  const fromPath = /^\/p\/([a-z0-9][a-z0-9-]*)/i.exec(pathname || '');
  if (fromPath) return fromPath[1].toLowerCase();
  const cleanHash = (hash || '').replace(/^#/, '');
  const fromHash = /^\/p\/([a-z0-9][a-z0-9-]*)/i.exec(cleanHash);
  return fromHash ? fromHash[1].toLowerCase() : null;
}

/**
 * Ordem de precedência: domínio próprio, subdomínio, caminho.
 * Um endereço mais específico sempre ganha do mais genérico.
 */
export function resolveTenant(
  location: { hostname: string; pathname: string; hash: string },
  platformHost: string = PLATFORM_HOST
): TenantRef {
  const host = (location.hostname || '').toLowerCase().replace(/\.$/, '');
  const platform = (platformHost || '').toLowerCase().replace(/^www\./, '');
  const slug = slugFromRoute(location.pathname, location.hash);

  const isDevHost = NON_TENANT_HOSTS.test(host);

  if (platform && !isDevHost && host && host !== platform && host !== `www.${platform}`) {
    if (host.endsWith(`.${platform}`)) {
      const sub = host.slice(0, -(platform.length + 1));
      // Só um nível conta: o certificado curinga não cobre a.b.dominio
      if (sub && !sub.includes('.') && !RESERVED_SUBDOMAINS.has(sub)) {
        return { mode: 'subdomain', slug: sub };
      }
    } else {
      return { mode: 'domain', domain: host };
    }
  }

  return slug ? { mode: 'path', slug } : NONE;
}

/** Endereço público da vitrine, conforme o que o plano do professor libera. */
export function buildPublicUrl(
  mode: AddressingMode,
  opts: { slug?: string; domain?: string; platformHost?: string; protocol?: string }
): string {
  const platform = (opts.platformHost ?? PLATFORM_HOST) || 'aquagenda.com.br';
  const scheme = opts.protocol ?? 'https://';
  if (mode === 'domain' && opts.domain) return `${scheme}${opts.domain}`;
  if (mode === 'subdomain' && opts.slug) return `${scheme}${opts.slug}.${platform}`;
  return `${scheme}${platform}/p/${opts.slug || ''}`;
}

const TITLE_PREFIXES = /^(prof|profa|professor|professora|dr|dra|sr|sra)\.?\s+/i;

/** Marcas de acento que a decomposição NFD separa das letras. */
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

/** Gera o identificador a partir do nome: "Prof. Roberto Almeida" vira "roberto-almeida". */
export function slugify(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(TITLE_PREFIXES, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/, '');
}

/** Acrescenta um número quando o identificador já está em uso. */
export function ensureUniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set([...taken].map((s) => s.toLowerCase()));
  const root = slugify(base) || 'professor';
  if (!used.has(root)) return root;
  let n = 2;
  while (used.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}
