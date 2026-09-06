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

/**
 * De quem é a vitrine pedida.
 * O caminho diz explicitamente (/p/ professor, /e/ academia). Subdomínio e
 * domínio próprio dividem o mesmo espaço, então quem decide é a consulta --
 * daí 'indefinido'. O banco garante que um endereço não pertence aos dois.
 */
export type TenantKind = 'professor' | 'empresa' | 'indefinido';

export interface TenantRef {
  mode: AddressingMode | 'none';
  kind: TenantKind;
  /** Identificador do professor ou da academia, para caminho e subdomínio */
  slug?: string;
  /** Domínio informado pelo visitante, para domínio próprio */
  domain?: string;
}

const NONE: TenantRef = { mode: 'none', kind: 'indefinido' };

/** Prefixo do caminho: "p" para professor, "e" para academia. */
const ROUTE_PREFIX: Record<string, TenantKind> = { p: 'professor', e: 'empresa' };

export interface RouteSlug {
  slug: string;
  kind: TenantKind;
}

/** Extrai o identificador de "/p/<slug>" ou "/e/<slug>", do caminho ou do hash. */
export function slugFromRoute(pathname: string, hash: string): RouteSlug | null {
  const padrao = /^\/(p|e)\/([a-z0-9][a-z0-9-]*)/i;
  const fromPath = padrao.exec(pathname || '');
  if (fromPath) {
    return { slug: fromPath[2].toLowerCase(), kind: ROUTE_PREFIX[fromPath[1].toLowerCase()] };
  }
  const cleanHash = (hash || '').replace(/^#/, '');
  const fromHash = padrao.exec(cleanHash);
  return fromHash
    ? { slug: fromHash[2].toLowerCase(), kind: ROUTE_PREFIX[fromHash[1].toLowerCase()] }
    : null;
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
  const rota = slugFromRoute(location.pathname, location.hash);

  const isDevHost = NON_TENANT_HOSTS.test(host);

  if (platform && !isDevHost && host && host !== platform && host !== `www.${platform}`) {
    if (host.endsWith(`.${platform}`)) {
      const sub = host.slice(0, -(platform.length + 1));
      // Só um nível conta: o certificado curinga não cobre a.b.dominio
      if (sub && !sub.includes('.') && !RESERVED_SUBDOMAINS.has(sub)) {
        // Pode ser academia ou professor: só a consulta resolve
        return { mode: 'subdomain', kind: 'indefinido', slug: sub };
      }
    } else {
      return { mode: 'domain', kind: 'indefinido', domain: host };
    }
  }

  return rota ? { mode: 'path', kind: rota.kind, slug: rota.slug } : NONE;
}

/** Endereço público da vitrine, conforme o que o plano do professor libera. */
export function buildPublicUrl(
  mode: AddressingMode,
  opts: {
    slug?: string;
    domain?: string;
    platformHost?: string;
    protocol?: string;
    /** 'empresa' usa /e/ no caminho; o padrão continua sendo o professor */
    kind?: TenantKind;
  }
): string {
  const platform = (opts.platformHost ?? PLATFORM_HOST) || 'aquagenda.com.br';
  const scheme = opts.protocol ?? 'https://';
  if (mode === 'domain' && opts.domain) return `${scheme}${opts.domain}`;
  if (mode === 'subdomain' && opts.slug) return `${scheme}${opts.slug}.${platform}`;
  const prefixo = opts.kind === 'empresa' ? 'e' : 'p';
  return `${scheme}${platform}/${prefixo}/${opts.slug || ''}`;
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
