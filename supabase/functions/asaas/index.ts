/**
 * asaas -- liga o Financeiro do professor à conta dele no Asaas.
 *
 * O Asaas não tem "entrar e autorizar" como o Mercado Pago: o professor gera
 * a chave de API na conta dele (Integrações > Chave de API) e cola no
 * Aquagenda, uma vez. Esta função:
 *   - confere a chave e guarda em asaas_contas (tabela fechada ao navegador);
 *   - cadastra sozinha, na conta do professor, o aviso de pagamento
 *     (webhook), para a cobrança dar baixa sem ninguém configurar nada;
 *   - cria cada cobrança no Asaas (Pix, boleto ou cartão) e devolve o link
 *     e o Pix Copia e Cola, que vão para o aluno pelo WhatsApp.
 *
 * O Asaas exige o CPF de quem paga. O aluno vira "cliente" no Asaas com
 * externalReference = id do aluno no Aquagenda; da segunda cobrança em
 * diante ele é reencontrado por aí e o professor não digita o CPF de novo.
 *
 * Portas:
 *   POST /asaas         o app, com o login do professor:
 *                       { acao: 'status' | 'conectar' | 'desconectar' | 'cobrar' }
 *   POST /asaas/aviso   o Asaas avisando que um pagamento mudou
 *
 * Publicada com verify_jwt = false, porque o aviso chega sem login. A porta
 * do app confere o login por conta própria (professorLogado).
 */

const SUPABASE_URL = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/+$/, '');
const URL_AVISO = `${SUPABASE_URL}/functions/v1/asaas/aviso`;

const API = {
  producao: 'https://api.asaas.com/v3',
  sandbox: 'https://api-sandbox.asaas.com/v3',
} as const;
type Ambiente = keyof typeof API;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  api_key: string;
  ambiente: Ambiente;
  nome: string | null;
  email: string | null;
  webhook_id: string | null;
  webhook_token: string;
  conectado_em: string;
}

async function lerConta(teacherId: string): Promise<Conta | null> {
  const resp = await banco(`asaas_contas?teacher_id=eq.${encodeURIComponent(teacherId)}&select=*`);
  if (!resp.ok) return null;
  const linhas = (await resp.json()) as Conta[];
  return linhas[0] ?? null;
}

// --------------------------------------------------------------------
// Asaas
// --------------------------------------------------------------------

async function asaas(conta: Pick<Conta, 'api_key' | 'ambiente'>, caminho: string, init: RequestInit = {}) {
  return fetch(`${API[conta.ambiente]}${caminho}`, {
    ...init,
    headers: {
      access_token: conta.api_key,
      'Content-Type': 'application/json',
      'User-Agent': 'Aquagenda',
      ...(init.headers ?? {}),
    },
  });
}

/** Chave de teste do Asaas traz "hmlg" (homologação); a de produção, não. */
function ambienteDaChave(chave: string): Ambiente {
  return /hmlg/i.test(chave) ? 'sandbox' : 'producao';
}

/** Primeira mensagem de erro que o Asaas devolve, para mostrar ao professor. */
async function erroDoAsaas(resp: Response): Promise<string> {
  const texto = await resp.text();
  try {
    const dados = JSON.parse(texto);
    return String(dados.errors?.[0]?.description ?? texto).slice(0, 300);
  } catch {
    return texto.slice(0, 300);
  }
}

/**
 * Token do aviso de pagamento. O Asaas recusa token com espaço, sequência
 * numérica ou letra repetida quatro vezes; 48 caracteres aleatórios de
 * base64url passam, e se um dia caírem na regra, a próxima tentativa sorteia outro.
 */
function novoToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(36));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// --------------------------------------------------------------------
// Quem está chamando
// --------------------------------------------------------------------

/** Mesma regra da função mercado-pago: o banco decide, com o login do usuário. */
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
    conectado: Boolean(conta),
    nome: conta?.nome ?? null,
    email: conta?.email ?? null,
    ambiente: conta?.ambiente ?? null,
    avisoConfigurado: Boolean(conta?.webhook_id),
    conectadoEm: conta?.conectado_em ?? null,
  });
}

/** Cadastra o aviso de pagamento na conta do professor. Devolve o id, ou null. */
async function criarAviso(conta: Pick<Conta, 'api_key' | 'ambiente'>, teacherId: string, token: string, email: string | null) {
  const resp = await asaas(conta, '/webhooks', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Aquagenda - baixa automática',
      url: `${URL_AVISO}?t=${encodeURIComponent(teacherId)}`,
      email: email || undefined,
      enabled: true,
      interrupted: false,
      apiVersion: 3,
      authToken: token,
      sendType: 'SEQUENTIALLY',
      events: ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_REFUNDED', 'PAYMENT_CHARGEBACK_REQUESTED'],
    }),
  });
  if (!resp.ok) {
    console.warn('Asaas recusou o aviso de pagamento:', resp.status, await erroDoAsaas(resp));
    return null;
  }
  const dados = await resp.json();
  return dados.id ? String(dados.id) : null;
}

async function conectar(teacherId: string, chaveInformada: string | undefined) {
  const chave = (chaveInformada ?? '').trim();
  if (!chave.startsWith('$aact_')) {
    return json(400, { erro: 'Essa não parece uma chave de API do Asaas. Ela começa com $aact_.' });
  }

  // A chave de teste mora em outro endereço; na dúvida, tenta os dois
  const ambientes: Ambiente[] = ambienteDaChave(chave) === 'sandbox' ? ['sandbox'] : ['producao', 'sandbox'];
  let ambiente: Ambiente | null = null;
  let dados: Record<string, any> = {};
  for (const amb of ambientes) {
    const resp = await asaas({ api_key: chave, ambiente: amb }, '/myAccount/commercialInfo');
    if (resp.ok) {
      ambiente = amb;
      dados = await resp.json();
      break;
    }
    // Sem permissão para dados comerciais, mas a chave vale: o saldo confirma
    const saldo = await asaas({ api_key: chave, ambiente: amb }, '/finance/balance');
    if (saldo.ok) {
      ambiente = amb;
      break;
    }
  }
  if (!ambiente) {
    return json(400, { erro: 'O Asaas não aceitou essa chave. Confira se copiou inteira, e se ela não foi apagada no Asaas.' });
  }

  const nome = (dados.companyName || dados.name || null) as string | null;
  const email = (dados.email || null) as string | null;

  // Reconectar troca o aviso antigo pelo novo, em vez de acumular
  const antiga = await lerConta(teacherId);
  if (antiga?.webhook_id && antiga.api_key === chave) {
    await asaas(antiga, `/webhooks/${antiga.webhook_id}`, { method: 'DELETE' });
  }

  const conta = { api_key: chave, ambiente };
  let token = novoToken();
  let webhookId = await criarAviso(conta, teacherId, token, email);
  if (!webhookId) {
    token = novoToken();
    webhookId = await criarAviso(conta, teacherId, token, email);
  }

  const resp = await banco('asaas_contas?on_conflict=teacher_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      teacher_id: teacherId,
      api_key: chave,
      ambiente,
      nome,
      email,
      webhook_id: webhookId,
      webhook_token: token,
      conectado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    }),
  });
  if (!resp.ok) return json(500, { erro: 'A chave é válida, mas não consegui salvar. Tente de novo.' });

  return json(200, {
    conectado: true,
    nome,
    email,
    ambiente,
    avisoConfigurado: Boolean(webhookId),
    conectadoEm: new Date().toISOString(),
  });
}

async function desconectar(teacherId: string) {
  const conta = await lerConta(teacherId);
  if (conta?.webhook_id) {
    // Tira o aviso da conta do professor: sem isso, o Asaas continuaria
    // chamando um endereço que não responde mais por ele
    await asaas(conta, `/webhooks/${conta.webhook_id}`, { method: 'DELETE' });
  }
  await banco(`asaas_contas?teacher_id=eq.${encodeURIComponent(teacherId)}`, { method: 'DELETE' });
  return json(200, { conectado: false });
}

interface PedidoCobranca {
  id?: string;
  descricao?: string;
  valor?: number;
  vencimento?: string; // YYYY-MM-DD
  alunoId?: string;
  alunoNome?: string;
  alunoEmail?: string;
  alunoTelefone?: string;
  alunoCpf?: string;
}

const soDigitos = (v?: string) => (v ?? '').replace(/\D/g, '');

/** Hoje em Brasília, YYYY-MM-DD: o Asaas recusa vencimento no passado. */
function hojeEmBrasilia(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * O aluno como cliente no Asaas: reencontra pelo id do aluno ou pelo CPF;
 * cria só se não achar. O Asaas aceita cliente duplicado, então procurar
 * antes evita encher a conta do professor de cópias do mesmo aluno.
 */
async function clienteDoAluno(conta: Conta, cobranca: PedidoCobranca): Promise<{ id: string } | { precisaCpf: true }> {
  const cpf = soDigitos(cobranca.alunoCpf);
  const buscas = [
    cobranca.alunoId ? `externalReference=${encodeURIComponent(cobranca.alunoId)}` : '',
    cpf ? `cpfCnpj=${cpf}` : '',
  ].filter(Boolean);

  for (const busca of buscas) {
    const resp = await asaas(conta, `/customers?${busca}&limit=1`);
    if (resp.ok) {
      const dados = await resp.json();
      const achado = dados.data?.find((c: any) => !c.deleted);
      if (achado?.id) return { id: String(achado.id) };
    }
  }

  if (cpf.length !== 11 && cpf.length !== 14) return { precisaCpf: true };

  const telefone = soDigitos(cobranca.alunoTelefone).replace(/^55(?=\d{10,11}$)/, '');
  const resp = await asaas(conta, '/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: cobranca.alunoNome || 'Aluno',
      cpfCnpj: cpf,
      email: cobranca.alunoEmail && cobranca.alunoEmail.includes('@') ? cobranca.alunoEmail : undefined,
      mobilePhone: telefone.length >= 10 ? telefone : undefined,
      externalReference: cobranca.alunoId || undefined,
      // O professor já avisa pelo WhatsApp do Aquagenda; aviso do Asaas por
      // SMS pode ter custo na conta dele
      notificationDisabled: true,
    }),
  });
  if (!resp.ok) throw new Error(`cliente: ${await erroDoAsaas(resp)}`);
  const dados = await resp.json();
  return { id: String(dados.id) };
}

async function cobrar(teacherId: string, cobranca: PedidoCobranca) {
  const valor = Math.round(Number(cobranca.valor) * 100) / 100;
  if (!cobranca.id || !(valor > 0)) return json(400, { erro: 'Cobrança sem id ou sem valor.' });
  if (valor < 5) return json(400, { erro: 'O Asaas só aceita cobranças a partir de R$ 5,00.' });

  const conta = await lerConta(teacherId);
  if (!conta) return json(409, { erro: 'Conecte o Asaas antes de gerar a cobrança.' });

  try {
    // Já existe cobrança no Asaas para esta cobrança do Aquagenda? Reaproveita:
    // clicar duas vezes não pode gerar duas cobranças para o aluno
    let pagamento: Record<string, any> | null = null;
    const existente = await asaas(conta, `/payments?externalReference=${encodeURIComponent(cobranca.id)}&limit=10`);
    if (existente.ok) {
      const dados = await existente.json();
      pagamento = dados.data?.find((p: any) => !p.deleted && ['PENDING', 'OVERDUE'].includes(p.status)) ?? null;
    }

    if (!pagamento) {
      const cliente = await clienteDoAluno(conta, cobranca);
      if ('precisaCpf' in cliente) {
        return json(422, { erro: 'O Asaas pede o CPF do aluno.', precisaCpf: true });
      }

      const vencimento = cobranca.vencimento && cobranca.vencimento >= hojeEmBrasilia()
        ? cobranca.vencimento
        : hojeEmBrasilia();

      const resp = await asaas(conta, '/payments', {
        method: 'POST',
        body: JSON.stringify({
          customer: cliente.id,
          // UNDEFINED: o aluno escolhe Pix, boleto ou cartão na página do Asaas
          billingType: 'UNDEFINED',
          value: valor,
          dueDate: vencimento,
          description: (cobranca.descricao || 'Aula').slice(0, 500),
          externalReference: cobranca.id,
        }),
      });
      if (!resp.ok) {
        const erro = await erroDoAsaas(resp);
        console.warn('Cobrança recusada pelo Asaas:', resp.status, erro);
        if (resp.status === 401) {
          return json(409, { erro: 'O Asaas recusou a chave. Clique em Desconectar e cole uma chave nova.' });
        }
        return json(502, { erro: `O Asaas não criou a cobrança: ${erro}` });
      }
      pagamento = await resp.json();
    }

    const link = String(pagamento!.invoiceUrl ?? '');

    let pixCode: string | null = null;
    let avisoPix: string | null = null;
    const pix = await asaas(conta, `/payments/${pagamento!.id}/pixQrCode`);
    if (pix.ok) {
      const dados = await pix.json();
      pixCode = dados.payload ? String(dados.payload) : null;
    } else {
      const erro = await erroDoAsaas(pix);
      console.warn('Pix recusado pelo Asaas:', pix.status, erro);
      avisoPix = /chave|key/i.test(erro)
        ? 'Sua conta do Asaas ainda não tem chave Pix. No Asaas, abra Pix > Minhas chaves e cadastre uma. Depois clique em Gerar Pix de novo.'
        : 'A cobrança foi criada, mas o Asaas não gerou o código Pix desta vez.';
    }

    const mudancas: Record<string, unknown> = { payment_link_url: link, updated_at: new Date().toISOString() };
    if (pixCode) mudancas.pix_code = pixCode;
    await banco(
      `payments?id=eq.${encodeURIComponent(cobranca.id)}&teacher_id=eq.${encodeURIComponent(teacherId)}`,
      { method: 'PATCH', body: JSON.stringify(mudancas) }
    );

    return json(200, { link, pixCode, avisoPix });
  } catch (err) {
    console.warn('Falha ao cobrar pelo Asaas:', err);
    return json(502, { erro: `O Asaas não criou a cobrança: ${(err as Error).message}` });
  }
}

// --------------------------------------------------------------------
// Aviso de pagamento
// --------------------------------------------------------------------

function metodoDoApp(tipo: string | undefined): string | null {
  if (tipo === 'PIX') return 'pix';
  if (tipo === 'CREDIT_CARD' || tipo === 'DEBIT_CARD') return 'cartao';
  if (tipo === 'BOLETO') return 'boleto';
  return null;
}

/**
 * Duas travas: o cabeçalho asaas-access-token tem que ser o token que esta
 * função sorteou para ESTE professor, e o pagamento é relido no Asaas com a
 * chave dele antes de mexer na cobrança.
 *
 * Responde 200 mesmo quando ignora: outra resposta faz o Asaas repetir o
 * aviso e, depois de muitas falhas, pausar a fila de avisos do professor.
 */
async function aviso(req: Request, url: URL): Promise<Response> {
  const teacherId = url.searchParams.get('t') ?? '';
  const conta = teacherId ? await lerConta(teacherId) : null;
  if (!conta) return json(200, { ignorado: 'professor sem Asaas' });

  if ((req.headers.get('asaas-access-token') ?? '') !== conta.webhook_token) {
    return json(401, { erro: 'token inválido' });
  }

  let corpo: Record<string, any> = {};
  try {
    corpo = await req.json();
  } catch {
    return json(200, { ignorado: 'corpo inválido' });
  }

  const pagamentoId = String(corpo.payment?.id ?? '');
  if (!pagamentoId) return json(200, { ignorado: 'aviso sem pagamento' });

  const resp = await asaas(conta, `/payments/${encodeURIComponent(pagamentoId)}`);
  if (!resp.ok) return json(200, { ignorado: `pagamento não encontrado (HTTP ${resp.status})` });
  const pagamento = await resp.json();

  const cobrancaId = String(pagamento.externalReference ?? '');
  if (!cobrancaId) return json(200, { ignorado: 'pagamento sem cobrança do Aquagenda' });

  const filtro = `payments?id=eq.${encodeURIComponent(cobrancaId)}&teacher_id=eq.${encodeURIComponent(teacherId)}`;
  const lida = await banco(`${filtro}&select=id,amount,status`);
  const cobranca = lida.ok ? ((await lida.json()) as { id: string; amount: number; status: string }[])[0] : undefined;
  if (!cobranca) return json(200, { ignorado: 'cobrança não é deste professor' });

  const agora = new Date().toISOString();

  if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(pagamento.status)) {
    if (Number(pagamento.value) + 0.009 < Number(cobranca.amount)) {
      return json(200, { ignorado: 'valor pago menor que a cobrança' });
    }
    const pagoEm = String(pagamento.clientPaymentDate ?? pagamento.paymentDate ?? pagamento.confirmedDate ?? agora).slice(0, 10);
    const mudancas: Record<string, unknown> = { status: 'pago', paid_at: pagoEm, updated_at: agora };
    const metodo = metodoDoApp(pagamento.billingType);
    if (metodo) mudancas.method = metodo;
    await banco(filtro, { method: 'PATCH', body: JSON.stringify(mudancas) });
    return json(200, { ok: true, cobranca: cobrancaId, status: 'pago' });
  }

  if (['REFUNDED', 'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE'].includes(pagamento.status) && cobranca.status === 'pago') {
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
  if (url.pathname.replace(/\/+$/, '').endsWith('/aviso')) return aviso(req, url);

  if (req.method !== 'POST') return json(405, { erro: 'Método não permitido.' });

  let corpo: { acao?: string; teacherId?: string; chave?: string; cobranca?: PedidoCobranca } = {};
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
      return conectar(teacherId, corpo.chave);
    case 'desconectar':
      return desconectar(teacherId);
    case 'cobrar':
      return cobrar(teacherId, corpo.cobranca ?? {});
    default:
      return json(400, { erro: 'Ação desconhecida.' });
  }
});
