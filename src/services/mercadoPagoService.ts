import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PaymentInvoice } from '../types';

/**
 * Conversa do app com a Edge Function mercado-pago.
 *
 * O token do Mercado Pago do professor nunca passa por aqui: ele mora no
 * banco, fechado para o navegador, e só a função o usa. O app só pergunta
 * "está conectado?", pede o endereço de autorização e pede links.
 */

export interface StatusMercadoPago {
  /** A plataforma tem a aplicação do Mercado Pago configurada. */
  configurado: boolean;
  conectado: boolean;
  apelido: string | null;
  email: string | null;
  conectadoEm: string | null;
}

export const STATUS_DESCONECTADO: StatusMercadoPago = {
  configurado: false,
  conectado: false,
  apelido: null,
  email: null,
  conectadoEm: null,
};

async function chamar<T>(corpo: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('O Mercado Pago só funciona com o banco de dados conectado.');
  }
  const { data, error } = await supabase.functions.invoke('mercado-pago', { body: corpo });
  if (error) {
    // A função devolve { erro } em português; o supabase-js guarda a resposta em error.context
    let mensagem = 'Não foi possível falar com o Mercado Pago agora.';
    try {
      const resposta = (error as { context?: Response }).context;
      const detalhe = resposta ? await resposta.json() : null;
      if (detalhe?.erro) mensagem = detalhe.erro;
    } catch {
      // mantém a mensagem padrão
    }
    throw new Error(mensagem);
  }
  return data as T;
}

export const mercadoPagoService = {
  async status(teacherId: string): Promise<StatusMercadoPago> {
    // Na demonstração o cartão aparece, para mostrar o recurso; conectar
    // avisa que precisa do banco (ver chamar)
    if (!isSupabaseConfigured) return { ...STATUS_DESCONECTADO, configurado: true };
    try {
      return await chamar<StatusMercadoPago>({ acao: 'status', teacherId });
    } catch {
      return STATUS_DESCONECTADO;
    }
  },

  /** Endereço da tela "Autorizar" do Mercado Pago. */
  async enderecoParaConectar(teacherId: string): Promise<string> {
    const { url } = await chamar<{ url: string }>({ acao: 'conectar', teacherId });
    return url;
  },

  async desconectar(teacherId: string): Promise<void> {
    await chamar({ acao: 'desconectar', teacherId });
  },

  /**
   * Link de pagamento do Mercado Pago para a cobrança e, quando a conta do
   * professor tem chave Pix no Mercado Pago, o Pix Copia e Cola com baixa
   * automática. `avisoPix` explica por que o Pix não veio.
   */
  async gerarLink(teacherId: string, invoice: PaymentInvoice): Promise<CobrancaMercadoPago> {
    const resposta = await chamar<CobrancaMercadoPago>({
      acao: 'cobrar',
      teacherId,
      cobranca: {
        id: invoice.id,
        descricao: invoice.serviceOrPlanName,
        valor: invoice.amount,
        alunoNome: invoice.studentName,
        alunoEmail: invoice.studentEmail,
        vencimento: invoice.dueDate,
      },
    });
    return { link: resposta.link, pixCode: resposta.pixCode ?? null, avisoPix: resposta.avisoPix ?? null };
  },
};

export interface CobrancaMercadoPago {
  link: string;
  pixCode: string | null;
  avisoPix: string | null;
}

/**
 * O Pix foi gerado por um recebedor conectado (Mercado Pago ou Asaas), e por
 * isso dá baixa sozinho?
 *
 * Os dois geram Pix DINÂMICO: dentro do código, logo depois de
 * "br.gov.bcb.pix", vem o campo 25 com o endereço da cobrança. O Pix feito
 * com a chave do professor (utils/pix) é estático e traz o campo 01, a chave.
 * Olhar o formato, e não o nome do banco, vale para qualquer recebedor.
 */
export function pixComBaixaAutomatica(pixCode?: string): boolean {
  return Boolean(pixCode && /br\.gov\.bcb\.pix25/i.test(pixCode));
}

/**
 * Lê e apaga o ?mercadopago=conectado|erro que a função põe na URL ao voltar
 * do site do Mercado Pago. Apaga para que recarregar a página não repita o aviso.
 */
export function lerRetornoDoMercadoPago(): 'conectado' | 'erro' | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash || '';
  const [caminho, busca = ''] = hash.split('?');
  const params = new URLSearchParams(busca);
  const valor = params.get('mercadopago');
  if (valor !== 'conectado' && valor !== 'erro') return null;

  params.delete('mercadopago');
  const resto = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${caminho}${resto ? `?${resto}` : ''}`);
  return valor;
}
