/**
 * mercado-pago -- liga o Financeiro do professor à conta dele no Mercado Pago.
 *
 * O professor não copia chave nenhuma. Ele clica em "Conectar Mercado Pago",
 * entra na conta dele no site do Mercado Pago e autoriza. Daí em diante:
 *   - cada cobrança ganha um link de pagamento de verdade (Pix, cartão ou
 *     boleto, na página do Mercado Pago), e o dinheiro cai na conta DELE;
 *   - quando o aluno paga, o Mercado Pago avisa esta função e a cobrança vira
 *     "Pago" sozinha, sem o professor dar baixa.
 *
 * Três portas na mesma função:
 *   POST /mercado-pago          o app, com o login do professor:
 *                               { acao: 'status' | 'conectar' | 'desconectar' | 'cobrar' }
 *   GET  /mercado-pago/retorno  a volta do Mercado Pago depois do "Autorizar"
 *   POST /mercado-pago/aviso    o Mercado Pago avisando que um pagamento mudou
 *
 * Publicada com verify_jwt = false, porque o retorno e o aviso chegam sem
 * login. A porta do app confere o login por conta própria (professorLogado).
 *
 * Segredos (Edge Functions > Secrets):
 *   MP_CLIENT_ID, MP_CLIENT_SECRET  da aplicação da plataforma no Mercado Pago
 *   APP_URL                         ex.: https://aquagenda.plataformaeducar.net
 */

const MP_API = 'https://api.mercadopago.com';
const MP_AUTORIZAR = 'https://auth.mercadopago.com.br/authorization';

const MP_CLIENT_ID = Deno.env.get('MP_CLIENT_ID') ?? '';
const MP_CLIENT_SECRET = Deno.env.get('MP_CLIENT_SECRET') ?? '';
const APP_URL = (Deno.env.get('APP_URL') ?? '').replace(/\/+$/, '');
const SUPABASE_URL = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/+$/, '');

/** O endereço exato cadastrado como "URL de redirecionamento" na aplicação do Mercado Pago. */
const URL_RETORNO = `${SUPABASE_URL}/functions/v1/mercado-pago/retorno`;
const URL_AVISO = `${SUPABASE_URL}/functions/v1/mercado-pago/aviso`;

/** Tempo para o professor concluir o "Autorizar" no site do Mercado Pago. */
const VALIDADE_PEDIDO_MS = 30 * 60 * 1000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

// --------------------------------------------------------------------
// Banco, com a chave de serviço
// --------------------------------------------------------------------

/** Mesma regra de sync-vercel-domain: a chave nova mora em SUPABASE_SECRET_KEYS. */
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

async function banco(caminho: string, init: RequestInit = {}): Promise<Response> {
  const chave = chaveDeServico();
  return fetch(`${SUPABASE_URL}/rest/v1/${caminho}`, {
    ...init,
    headers: {
      apikey: chave,
      Authorization: `Bearer ${chave}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

interface Conta {
  teacher_id: string;
  mp_user_id: string;
  apelido: string | null;
  email: string | null;
  access_token: string;
  refresh_token: string | null;
  expira_em: string | null;
  conectado_em: string;
}

async function lerConta(teacherId: string): Promise<Conta | null> {
  const resp = await banco(
    `mercado_pago_contas?teacher_id=eq.${encodeURIComponent(teacherId)}&select=*`
  );
  if (!resp.ok) return null;
  const linhas = (await resp.json()) as Conta[];
  return linhas[0] ?? null;
}

async function gravarConta(conta: Omit<Conta, 'conectado_em'> & { conectado_em?: string }) {
  const resp = await banco('mercado_pago_contas?on_conflict=teacher_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ ...conta, atualizado_em: new Date().toISOString() }),
  });
  if (!resp.ok) throw new Error(`gravar conta: HTTP ${resp.status} ${await resp.text()}`);
}

// --------------------------------------------------------------------
// Mercado Pago
// --------------------------------------------------------------------

interface TokenMP {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user_id: number | string;
}

async function pedirToken(corpo: Record<string, string>): Promise<TokenMP> {
  const resp = await fetch(`${MP_API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: MP_CLIENT_ID, client_secret: MP_CLIENT_SECRET, ...corpo }),
  });
  if (!resp.ok) throw new Error(`oauth/token: HTTP ${resp.status} ${await resp.text()}`);
  return (await resp.json()) as TokenMP;
}

const expiraEm = (t: TokenMP) =>
  t.expires_in ? new Date(Date.now() + t.expires_in * 1000).toISOString() : null;

/**
 * O token do professor, renovado se estiver perto de vencer.
 *
 * O Mercado Pago entrega tokens de 180 dias. Renovar na última semana evita
 * que o professor descubra, no dia em que o aluno for pagar, que precisa
 * conectar de novo.
 */
async function tokenValido(conta: Conta): Promise<string> {
  const vence = conta.expira_em ? new Date(conta.expira_em).getTime() : Infinity;
  const umaSemana = 7 * 24 * 60 * 60 * 1000;
  if (vence - Date.now() > umaSemana || !conta.refresh_token) return conta.access_token;

  try {
    const novo = await pedirToken({ grant_type: 'refresh_token', refresh_token: conta.refresh_token });
    await gravarConta({
      ...conta,
      access_token: novo.access_token,
      refresh_token: novo.refresh_token ?? conta.refresh_token,
      expira_em: expiraEm(novo),
    });
    return novo.access_token;
  } catch (err) {
    // Renovar falhou, mas o token atual ainda vale até expira_em
    console.warn('Renovação do token do Mercado Pago falhou:', err);
    return conta.access_token;
  }
}

async function mp(token: string, caminho: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${MP_API}${caminho}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

// --------------------------------------------------------------------
// Quem está chamando
// --------------------------------------------------------------------

/**
 * O professor dono do Financeiro que o usuário logado pode mexer.
 *
 * Quem decide é o próprio banco, com as MESMAS regras do resto do app:
 * get_current_teacher_id e is_tenant_owner rodam com o login do usuário.
 * Assim professor, gestor com financeiro liberado e admin funcionam, e
 * assistente e aluno não -- sem repetir a regra aqui.
 */
async function professorLogado(req: Request, pedido: string | undefined): Promise<string | null> {
  const autorizacao = req.headers.get('Authorization') ?? '';
  const apikey = req.headers.get('apikey') ?? '';
  if (!autorizacao.startsWith('Bearer ') || !apikey) return null;

  const rpc = async (nome: string, corpo: unknown) => {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nome}`, {
      method: 'POST',
      headers: { apikey, Authorization: autorizacao, 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    return resp.ok ? resp.json() : null;
  };

  const teacherId = pedido || ((await rpc('get_current_teacher_id', {})) as string | null);
  if (!teacherId) return null;

  const dono = await rpc('is_tenant_owner', { target_teacher: teacherId });
  return dono === true ? teacherId : null;
}

// --------------------------------------------------------------------
// Ações do app
// --------------------------------------------------------------------

async function status(teacherId: string) {
  const conta = await lerConta(teacherId);
  return json(200, {
    configurado: Boolean(MP_CLIENT_ID && MP_CLIENT_SECRET && APP_URL),
    conectado: Boolean(conta),
    apelido: conta?.apelido ?? null,
    email: conta?.email ?? null,
    conectadoEm: conta?.conectado_em ?? null,
  });
}

async function conectar(teacherId: string) {
  if (!MP_CLIENT_ID || !MP_CLIENT_SECRET || !APP_URL) {
    return json(503, { erro: 'A conexão com o Mercado Pago ainda não foi ativada na plataforma.' });
  }

  const estado = crypto.randomUUID();
  const resp = await banco('mercado_pago_pedidos_conexao', {
    method: 'POST',
    body: JSON.stringify({ estado, teacher_id: teacherId }),
  });
  if (!resp.ok) return json(500, { erro: 'Não foi possível iniciar a conexão.' });

  const url = new URL(MP_AUTORIZAR);
  url.searchParams.set('client_id', MP_CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('platform_id', 'mp');
  url.searchParams.set('state', estado);
  url.searchParams.set('redirect_uri', URL_RETORNO);
  return json(200, { url: url.toString() });
}

async function desconectar(teacherId: string) {
  await banco(`mercado_pago_contas?teacher_id=eq.${encodeURIComponent(teacherId)}`, {
    method: 'DELETE',
  });
  return json(200, { conectado: false });
}

interface PedidoCobranca {
  id?: string;
  descricao?: string;
  valor?: number;
  alunoNome?: string;
  alunoEmail?: string;
  vencimento?: string; // YYYY-MM-DD
}

async function cobrar(teacherId: string, cobranca: PedidoCobranca) {
  const valor = Number(cobranca.valor);
  if (!cobranca.id || !(valor > 0)) return json(400, { erro: 'Cobrança sem id ou sem valor.' });

  const conta = await lerConta(teacherId);
  if (!conta) return json(409, { erro: 'Conecte o Mercado Pago antes de gerar o link.' });
  const token = await tokenValido(conta);

  const preferencia: Record<string, unknown> = {
    items: [
      {
        id: cobranca.id,
        title: (cobranca.descricao || 'Aula').slice(0, 250),
        quantity: 1,
        unit_price: Math.round(valor * 100) / 100,
        currency_id: 'BRL',
      },
    ],
    // É por aqui que o aviso de pagamento encontra a cobrança certa
    external_reference: cobranca.id,
    notification_url: `${URL_AVISO}?t=${encodeURIComponent(teacherId)}`,
    back_urls: {
      success: `${APP_URL}/#/portal`,
      pending: `${APP_URL}/#/portal`,
      failure: `${APP_URL}/#/portal`,
    },
    auto_return: 'approved',
  };

  const payer: Record<string, string> = {};
  if (cobranca.alunoNome) payer.name = cobranca.alunoNome;
  if (cobranca.alunoEmail && cobranca.alunoEmail.includes('@')) payer.email = cobranca.alunoEmail;
  if (Object.keys(payer).length) preferencia.payer = payer;

  const resp = await mp(token, '/checkout/preferences', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': `${teacherId}-${cobranca.id}-${valor}` },
    body: JSON.stringify(preferencia),
  });
  if (!resp.ok) {
    console.warn('Preferência recusada pelo Mercado Pago:', resp.status, await resp.text());
    if (resp.status === 401) {
      return json(409, { erro: 'O Mercado Pago recusou a conexão. Clique em Desconectar e conecte de novo.' });
    }
    return json(502, { erro: 'O Mercado Pago não gerou o link. Tente de novo em instantes.' });
  }

  const dados = await resp.json();
  const link = String(dados.init_point ?? '');

  // Grava o link na cobrança, se ela já estiver no banco. Se o app ainda não
  // terminou de salvar, ele mesmo grava o link que recebe na resposta.
  await banco(
    `payments?id=eq.${encodeURIComponent(cobranca.id)}&teacher_id=eq.${encodeURIComponent(teacherId)}`,
    { method: 'PATCH', body: JSON.stringify({ payment_link_url: link, updated_at: new Date().toISOString() }) }
  );

  return json(200, { link });
}

// --------------------------------------------------------------------
// Volta do "Autorizar"
// --------------------------------------------------------------------

const voltarParaApp = (resultado: 'conectado' | 'erro') =>
  new Response(null, {
    status: 302,
    headers: { Location: `${APP_URL}/#/financeiro?mercadopago=${resultado}` },
  });

async function retorno(url: URL): Promise<Response> {
  const codigo = url.searchParams.get('code');
  const estado = url.searchParams.get('state');
  if (!codigo || !estado) return voltarParaApp('erro');

  // O pedido só vale uma vez: apaga e devolve na mesma chamada
  const resp = await banco(`mercado_pago_pedidos_conexao?estado=eq.${encodeURIComponent(estado)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' },
  });
  const pedidos = resp.ok ? ((await resp.json()) as { teacher_id: string; criado_em: string }[]) : [];
  const pedido = pedidos[0];
  if (!pedido || Date.now() - new Date(pedido.criado_em).getTime() > VALIDADE_PEDIDO_MS) {
    return voltarParaApp('erro');
  }

  try {
    const token = await pedirToken({
      grant_type: 'authorization_code',
      code: codigo,
      redirect_uri: URL_RETORNO,
    });

    let apelido: string | null = null;
    let email: string | null = null;
    const eu = await mp(token.access_token, '/users/me');
    if (eu.ok) {
      const dados = await eu.json();
      apelido = [dados.first_name, dados.last_name].filter(Boolean).join(' ') || dados.nickname || null;
      email = dados.email ?? null;
    }

    await gravarConta({
      teacher_id: pedido.teacher_id,
      mp_user_id: String(token.user_id),
      apelido,
      email,
      access_token: token.access_token,
      refresh_token: token.refresh_token ?? null,
      expira_em: expiraEm(token),
      conectado_em: new Date().toISOString(),
    });
    return voltarParaApp('conectado');
  } catch (err) {
    console.warn('Falha ao concluir a conexão com o Mercado Pago:', err);
    return voltarParaApp('erro');
  }
}

// --------------------------------------------------------------------
// Aviso de pagamento
// --------------------------------------------------------------------

/** Como o Mercado Pago chama cada forma de pagamento, no vocabulário do app. */
function metodoDoApp(tipo: string | undefined): string | null {
  if (tipo === 'bank_transfer' || tipo === 'pix') return 'pix';
  if (tipo === 'credit_card' || tipo === 'debit_card' || tipo === 'prepaid_card') return 'cartao';
  if (tipo === 'ticket' || tipo === 'atm') return 'boleto';
  return null;
}

/**
 * Nada aqui confia no conteúdo do aviso. Ele só diz "olhe o pagamento N";
 * o pagamento é lido de volta no Mercado Pago com o token do professor. Um
 * aviso falso, então, no máximo faz a função conferir um pagamento que não
 * existe -- e nada muda.
 *
 * Responde 200 mesmo quando ignora: qualquer outra coisa faz o Mercado Pago
 * repetir o mesmo aviso por dias.
 */
async function aviso(req: Request, url: URL): Promise<Response> {
  const teacherId = url.searchParams.get('t') ?? '';
  let corpo: Record<string, any> = {};
  try {
    corpo = await req.json();
  } catch {
    // Alguns avisos chegam só com a query string
  }

  const tipo = String(corpo.type ?? corpo.topic ?? url.searchParams.get('type') ?? url.searchParams.get('topic') ?? '');
  const pagamentoId = String(corpo.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? '');
  if (tipo !== 'payment' || !pagamentoId || !teacherId) return json(200, { ignorado: true });

  const conta = await lerConta(teacherId);
  if (!conta) return json(200, { ignorado: 'professor sem Mercado Pago' });

  const resp = await mp(await tokenValido(conta), `/v1/payments/${encodeURIComponent(pagamentoId)}`);
  if (!resp.ok) return json(200, { ignorado: `pagamento não encontrado (HTTP ${resp.status})` });
  const pagamento = await resp.json();

  const cobrancaId = String(pagamento.external_reference ?? '');
  if (!cobrancaId) return json(200, { ignorado: 'pagamento sem cobrança' });

  const lida = await banco(
    `payments?id=eq.${encodeURIComponent(cobrancaId)}&teacher_id=eq.${encodeURIComponent(teacherId)}&select=id,amount,status`
  );
  const cobranca = lida.ok ? ((await lida.json()) as { id: string; amount: number; status: string }[])[0] : undefined;
  if (!cobranca) return json(200, { ignorado: 'cobrança não é deste professor' });

  const filtro = `payments?id=eq.${encodeURIComponent(cobrancaId)}&teacher_id=eq.${encodeURIComponent(teacherId)}`;
  const agora = new Date().toISOString();

  if (pagamento.status === 'approved') {
    // Pagou menos que o valor da cobrança: não dá baixa sozinho
    if (Number(pagamento.transaction_amount) + 0.009 < Number(cobranca.amount)) {
      return json(200, { ignorado: 'valor pago menor que a cobrança' });
    }
    const pagoEm = String(pagamento.date_approved ?? agora).slice(0, 10);
    const mudancas: Record<string, unknown> = { status: 'pago', paid_at: pagoEm, updated_at: agora };
    const metodo = metodoDoApp(pagamento.payment_type_id);
    if (metodo) mudancas.method = metodo;
    await banco(filtro, { method: 'PATCH', body: JSON.stringify(mudancas) });
    return json(200, { ok: true, cobranca: cobrancaId, status: 'pago' });
  }

  // Estornado ou contestado depois de pago: volta a ficar em aberto
  if (['refunded', 'charged_back'].includes(pagamento.status) && cobranca.status === 'pago') {
    await banco(filtro, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'pendente', paid_at: null, updated_at: agora }),
    });
    return json(200, { ok: true, cobranca: cobrancaId, status: 'pendente' });
  }

  return json(200, { ok: true, cobranca: cobrancaId, semMudanca: pagamento.status });
}

// --------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const url = new URL(req.url);
  const caminho = url.pathname.replace(/\/+$/, '');

  if (caminho.endsWith('/retorno')) return retorno(url);
  if (caminho.endsWith('/aviso')) return aviso(req, url);

  if (req.method !== 'POST') return json(405, { erro: 'Método não permitido.' });

  let corpo: { acao?: string; teacherId?: string; cobranca?: PedidoCobranca } = {};
  try {
    corpo = await req.json();
  } catch {
    return json(400, { erro: 'Corpo inválido.' });
  }

  const teacherId = await professorLogado(req, corpo.teacherId);
  if (!teacherId) return json(403, { erro: 'Sem permissão para o Financeiro deste professor.' });

  switch (corpo.acao) {
    case 'status':
      return status(teacherId);
    case 'conectar':
      return conectar(teacherId);
    case 'desconectar':
      return desconectar(teacherId);
    case 'cobrar':
      return cobrar(teacherId, corpo.cobranca ?? {});
    default:
      return json(400, { erro: 'Ação desconhecida.' });
  }
});
