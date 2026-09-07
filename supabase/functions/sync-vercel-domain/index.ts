/**
 * sync-vercel-domain -- registra na Vercel o endereço de quem acabou de ganhar um.
 *
 * O DNS já resolve qualquer subdomínio, por causa do curinga
 * `*.<PLATFORM_HOST>`. Mas a Vercel roteia pelo cabeçalho Host: nome que ela
 * não conhece devolve DEPLOYMENT_NOT_FOUND. Então cada endereço precisa de uma
 * linha lá -- e é essa linha que esta função cria, no lugar de alguém abrir o
 * painel a cada professor cadastrado.
 *
 * Chamada por um Database Webhook do Supabase em INSERT/UPDATE de
 * public.teachers e public.companies.
 *
 * Roda com verify_jwt = false, porque quem chama é o Postgres, não um usuário
 * logado. A porta é o segredo compartilhado no cabeçalho -- sem ele, qualquer
 * um na internet mandaria domínio para o seu projeto.
 */

const VERCEL_TOKEN = Deno.env.get('VERCEL_TOKEN') ?? '';
const VERCEL_PROJECT_ID = Deno.env.get('VERCEL_PROJECT_ID') ?? '';
const VERCEL_TEAM_ID = Deno.env.get('VERCEL_TEAM_ID') ?? '';
const PLATFORM_HOST = (Deno.env.get('PLATFORM_HOST') ?? '').trim().toLowerCase();
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') ?? '';

/**
 * Nomes que nunca viram endereço de professor.
 *
 * Os doze primeiros espelham RESERVED_SUBDOMAINS em src/utils/tenant.ts -- se
 * mudar lá, mude aqui. O resto é o que o cPanel cria sozinho na zona: têm
 * registro próprio, então o curinga não os alcança, e registrá-los na Vercel
 * criaria um endereço que nunca carrega.
 */
const RESERVADOS = new Set([
  'www', 'app', 'api', 'admin', 'painel', 'auth', 'cdn', 'static', 'assets', 'mail', 'blog', 'docs',
  'localhost', 'ftp', 'cpanel', 'webdisk', 'webmail', 'autoconfig', 'autodiscover',
  'whm', 'cpcontacts', 'cpcalendars', 'titan1', 'teste',
]);

/** Planos que liberam subdomínio. O start é endereço por caminho: /p/<slug>. */
const PLANOS_COM_SUBDOMINIO = new Set(['pro', 'premium']);

interface Registro {
  id?: string;
  slug?: string | null;
  plan?: string | null;
  company_id?: string | null;
  custom_domain?: string | null;
}

interface Payload {
  type?: 'INSERT' | 'UPDATE' | 'DELETE';
  table?: string;
  record?: Registro | null;
  old_record?: Registro | null;
  /** 'reconciliar' pede a varredura completa, em vez de tratar uma linha só. */
  acao?: 'reconciliar';
}

const json = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Slug que pode virar subdomínio: uma etiqueta DNS, e não um nome reservado. */
function slugUtilizavel(slug: string | null | undefined): slug is string {
  if (!slug) return false;
  const s = slug.trim().toLowerCase();
  if (RESERVADOS.has(s)) return false;
  // Etiqueta DNS: letras, números e hífen no meio, até 63 caracteres
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(s);
}

function urlVercel(caminho: string): string {
  const base = `https://api.vercel.com${caminho}`;
  if (!VERCEL_TEAM_ID) return base;
  return `${base}${caminho.includes('?') ? '&' : '?'}teamId=${VERCEL_TEAM_ID}`;
}

/**
 * Garante que o domínio existe no projeto.
 *
 * 409 significa que ele já está lá: é sucesso, não erro. Sem isso, todo UPDATE
 * do professor viraria falha no log, e a falha de verdade sumiria no meio.
 */
async function adicionarDominio(dominio: string): Promise<{ ok: boolean; detalhe: string }> {
  const resp = await fetch(urlVercel(`/v10/projects/${VERCEL_PROJECT_ID}/domains`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: dominio }),
  });

  if (resp.ok) return { ok: true, detalhe: 'criado' };
  if (resp.status === 409) return { ok: true, detalhe: 'ja existia' };

  const erro = await resp.text();
  return { ok: false, detalhe: `HTTP ${resp.status}: ${erro.slice(0, 300)}` };
}

/**
 * Tira da Vercel o endereço que o professor deixou de usar.
 *
 * 404 é sucesso pelo mesmo motivo: o que se queria era não estar lá.
 */
async function removerDominio(dominio: string): Promise<{ ok: boolean; detalhe: string }> {
  const resp = await fetch(urlVercel(`/v9/projects/${VERCEL_PROJECT_ID}/domains/${dominio}`), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  });

  if (resp.ok) return { ok: true, detalhe: 'removido' };
  if (resp.status === 404) return { ok: true, detalhe: 'nao estava la' };

  const erro = await resp.text();
  return { ok: false, detalhe: `HTTP ${resp.status}: ${erro.slice(0, 300)}` };
}

/**
 * A chave que lê o banco por dentro, sem passar por RLS.
 *
 * SUPABASE_SERVICE_ROLE_KEY está marcada como obsoleta no painel: os projetos
 * novos entregam as chaves em SUPABASE_SECRET_KEYS, um dicionário JSON. Tentar
 * as duas evita que a função pare de funcionar no dia em que a antiga sair.
 */
function chaveDeServico(): string {
  const direta = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (direta) return direta;

  try {
    const dicionario = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
    const valores = Object.values(dicionario).filter((v): v is string => typeof v === 'string');
    return valores[0] ?? '';
  } catch {
    return '';
  }
}

/**
 * O plano que vale para este registro.
 *
 * Espelha effectivePlan em src/utils/plans.ts: quando o professor pertence a
 * uma academia, quem assina é ela -- o professor não herda o endereço do
 * plano dele, e sim do da empresa.
 */
async function planoEfetivo(tabela: string, registro: Registro): Promise<string> {
  if (tabela === 'companies' || !registro.company_id) return registro.plan ?? 'start';

  const url = Deno.env.get('SUPABASE_URL');
  const chave = chaveDeServico();
  if (!url || !chave) return registro.plan ?? 'start';

  const resp = await fetch(
    `${url}/rest/v1/companies?id=eq.${encodeURIComponent(registro.company_id)}&select=plan`,
    { headers: { apikey: chave, Authorization: `Bearer ${chave}` } }
  );
  if (!resp.ok) return registro.plan ?? 'start';

  const linhas = (await resp.json()) as Array<{ plan?: string | null }>;
  return linhas[0]?.plan ?? registro.plan ?? 'start';
}

/** Lê uma tabela inteira pela API REST, com a chave de serviço. */
async function lerTabela<T>(tabela: string, colunas: string): Promise<T[]> {
  const url = Deno.env.get('SUPABASE_URL');
  const chave = chaveDeServico();
  if (!url || !chave) return [];

  const resp = await fetch(`${url}/rest/v1/${tabela}?select=${colunas}`, {
    headers: { apikey: chave, Authorization: `Bearer ${chave}` },
  });
  if (!resp.ok) return [];
  return (await resp.json()) as T[];
}

/** Todos os domínios que o projeto já tem na Vercel. */
async function dominiosNaVercel(): Promise<{ nomes: Set<string>; erro?: string }> {
  const nomes = new Set<string>();
  let ate: string | undefined;

  // A Vercel pagina de 100 em 100; sem o laço, o de número 101 seria
  // recriado todo dia porque a lista nunca o mostrava.
  for (let pagina = 0; pagina < 20; pagina++) {
    const sufixo = `/v9/projects/${VERCEL_PROJECT_ID}/domains?limit=100${ate ? `&until=${ate}` : ''}`;
    const resp = await fetch(urlVercel(sufixo), {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    });
    if (!resp.ok) {
      return { nomes, erro: `HTTP ${resp.status}: ${(await resp.text()).slice(0, 200)}` };
    }

    const dados = await resp.json();
    for (const d of dados.domains ?? []) nomes.add(String(d.name).toLowerCase());

    const proxima = dados.pagination?.next;
    if (!proxima) break;
    ate = String(proxima);
  }

  return { nomes };
}

/**
 * Confere se todo mundo que deveria ter endereço tem, e cria o que faltar.
 *
 * O gatilho do banco é rápido mas frágil: se a Vercel estiver fora do ar no
 * segundo em que o professor salva, ele fica sem endereço e ninguém percebe.
 * Esta varredura é a rede embaixo -- roda todo dia e reencontra quem ficou
 * para trás, inclusive os endereços criados à mão antes desta automação.
 *
 * Ela só ACRESCENTA. Apagar o que sobra seria dar a uma rotina automática o
 * poder de derrubar um endereço que alguém pôs ali de propósito; o que sobra
 * é relatado, e a decisão fica com quem lê.
 */
async function reconciliar() {
  const empresas = await lerTabela<{ id: string; slug: string | null; plan: string | null; custom_domain: string | null }>(
    'companies', 'id,slug,plan,custom_domain'
  );
  const professores = await lerTabela<Registro>('teachers', 'id,slug,plan,company_id,custom_domain');

  const planoDaEmpresa = new Map(empresas.map((e) => [e.id, e.plan ?? 'start']));

  const esperados = new Set<string>();
  for (const p of professores) {
    const plano = p.company_id ? (planoDaEmpresa.get(p.company_id) ?? p.plan ?? 'start') : (p.plan ?? 'start');
    if (!PLANOS_COM_SUBDOMINIO.has(plano)) continue;
    if (slugUtilizavel(p.slug)) esperados.add(`${p.slug!.trim().toLowerCase()}.${PLATFORM_HOST}`);
    if (plano === 'premium' && p.custom_domain) esperados.add(p.custom_domain.trim().toLowerCase());
  }
  for (const e of empresas) {
    const plano = e.plan ?? 'start';
    if (!PLANOS_COM_SUBDOMINIO.has(plano)) continue;
    if (slugUtilizavel(e.slug)) esperados.add(`${e.slug!.trim().toLowerCase()}.${PLATFORM_HOST}`);
    if (plano === 'premium' && e.custom_domain) esperados.add(e.custom_domain.trim().toLowerCase());
  }

  const { nomes: naVercel, erro } = await dominiosNaVercel();
  if (erro) {
    // Token vencido cai aqui. Devolver 500 faz o erro aparecer nos logs, em
    // vez de a varredura "passar" todo dia sem ter olhado nada.
    return json(500, { ok: false, erro: `não consegui listar os domínios da Vercel -- ${erro}` });
  }

  const criados: string[] = [];
  const falhas: string[] = [];
  for (const dominio of esperados) {
    if (naVercel.has(dominio)) continue;
    const r = await adicionarDominio(dominio);
    if (r.ok) criados.push(dominio);
    else falhas.push(`${dominio}: ${r.detalhe}`);
  }

  // O que está na Vercel e ninguém reivindica. Só relatado, nunca apagado.
  const sobrando = [...naVercel].filter(
    (d) => d.endsWith(`.${PLATFORM_HOST}`) && !esperados.has(d)
  );

  return json(falhas.length ? 500 : 200, {
    ok: !falhas.length,
    esperados: esperados.size,
    ja_existiam: esperados.size - criados.length - falhas.length,
    criados,
    falhas,
    sobrando,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json(405, { erro: 'use POST' });

  if (!WEBHOOK_SECRET || req.headers.get('x-aquagenda-secret') !== WEBHOOK_SECRET) {
    return json(401, { erro: 'segredo invalido' });
  }
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID || !PLATFORM_HOST) {
    return json(500, { erro: 'faltam VERCEL_TOKEN, VERCEL_PROJECT_ID ou PLATFORM_HOST' });
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { erro: 'corpo nao e JSON' });
  }

  // A varredura diária entra pela mesma porta, com o mesmo segredo.
  if (payload.acao === 'reconciliar') return await reconciliar();

  const tabela = payload.table ?? '';
  const registro = payload.record ?? null;
  const anterior = payload.old_record ?? null;
  const acoes: string[] = [];

  // Slug que saiu de circulação: trocado ou apagado.
  const slugAntigo = anterior?.slug?.trim().toLowerCase();
  const slugNovo = registro?.slug?.trim().toLowerCase();
  if (slugAntigo && slugAntigo !== slugNovo && slugUtilizavel(slugAntigo)) {
    const r = await removerDominio(`${slugAntigo}.${PLATFORM_HOST}`);
    acoes.push(`${slugAntigo}.${PLATFORM_HOST}: ${r.detalhe}`);
  }

  if (!registro) return json(200, { ok: true, acoes });

  const plano = await planoEfetivo(tabela, registro);

  // Endereço próprio é venda do Pro para cima. No start a vitrine é /p/<slug>,
  // e registrar o subdomínio aqui entregaria de graça o que o Pro cobra.
  if (!PLANOS_COM_SUBDOMINIO.has(plano)) {
    if (slugUtilizavel(slugNovo)) {
      const r = await removerDominio(`${slugNovo}.${PLATFORM_HOST}`);
      acoes.push(`${slugNovo}.${PLATFORM_HOST}: plano ${plano} nao tem subdominio (${r.detalhe})`);
    }
    return json(200, { ok: true, plano, acoes });
  }

  const falhas: string[] = [];

  if (slugUtilizavel(slugNovo)) {
    const dominio = `${slugNovo}.${PLATFORM_HOST}`;
    const r = await adicionarDominio(dominio);
    acoes.push(`${dominio}: ${r.detalhe}`);
    if (!r.ok) falhas.push(dominio);
  } else if (slugNovo) {
    acoes.push(`slug "${slugNovo}" recusado: reservado ou fora do formato DNS`);
  }

  // Premium também pode trazer o domínio que ele mesmo comprou.
  const dominioProprio = registro.custom_domain?.trim().toLowerCase();
  if (plano === 'premium' && dominioProprio) {
    const r = await adicionarDominio(dominioProprio);
    acoes.push(`${dominioProprio}: ${r.detalhe}`);
    if (!r.ok) falhas.push(dominioProprio);
  }

  // Devolver 500 na falha faz o Supabase registrar o erro; a rede de segurança
  // de verdade é a reconciliação diária, que reencontra quem ficou para trás.
  return json(falhas.length ? 500 : 200, { ok: !falhas.length, plano, acoes, falhas });
});
