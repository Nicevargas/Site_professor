import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PaymentInvoice } from '../types';
import { CobrancaMercadoPago } from './mercadoPagoService';

/**
 * Conversa do app com a Edge Function asaas.
 *
 * A chave de API do professor passa por aqui UMA vez, no conectar, e vai
 * direto para a função, que a guarda numa tabela fechada ao navegador.
 * Depois disso o app só pergunta "está conectado?" e pede cobranças.
 */

export interface StatusAsaas {
  conectado: boolean;
  nome: string | null;
  email: string | null;
  ambiente: 'producao' | 'sandbox' | null;
  /** O aviso de pagamento foi cadastrado na conta do professor (baixa automática). */
  avisoConfigurado: boolean;
  conectadoEm: string | null;
}

export const ASAAS_DESCONECTADO: StatusAsaas = {
  conectado: false,
  nome: null,
  email: null,
  ambiente: null,
  avisoConfigurado: false,
  conectadoEm: null,
};

/** O Asaas pediu o CPF do aluno: a tela pergunta e tenta de novo. */
export class PrecisaCpf extends Error {
  constructor() {
    super('O Asaas pede o CPF do aluno.');
    this.name = 'PrecisaCpf';
  }
}

async function chamar<T>(corpo: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('O Asaas só funciona com o banco de dados conectado.');
  }
  const { data, error } = await supabase.functions.invoke('asaas', { body: corpo });
  if (error) {
    let mensagem = 'Não foi possível falar com o Asaas agora.';
    let detalhe: { erro?: string; precisaCpf?: boolean } | null = null;
    try {
      const resposta = (error as { context?: Response }).context;
      detalhe = resposta ? await resposta.json() : null;
    } catch {
      // mantém a mensagem padrão
    }
    if (detalhe?.precisaCpf) throw new PrecisaCpf();
    if (detalhe?.erro) mensagem = detalhe.erro;
    throw new Error(mensagem);
  }
  return data as T;
}

export const asaasService = {
  async status(teacherId: string): Promise<StatusAsaas> {
    if (!isSupabaseConfigured) return ASAAS_DESCONECTADO;
    try {
      return await chamar<StatusAsaas>({ acao: 'status', teacherId });
    } catch {
      return ASAAS_DESCONECTADO;
    }
  },

  async conectar(teacherId: string, chave: string): Promise<StatusAsaas> {
    return chamar<StatusAsaas>({ acao: 'conectar', teacherId, chave: chave.trim() });
  },

  async desconectar(teacherId: string): Promise<void> {
    await chamar({ acao: 'desconectar', teacherId });
  },

  /** Cria a cobrança no Asaas; lança PrecisaCpf se o aluno ainda não é cliente lá. */
  async gerarLink(teacherId: string, invoice: PaymentInvoice, cpf?: string): Promise<CobrancaMercadoPago> {
    const resposta = await chamar<CobrancaMercadoPago>({
      acao: 'cobrar',
      teacherId,
      cobranca: {
        id: invoice.id,
        descricao: invoice.serviceOrPlanName,
        valor: invoice.amount,
        vencimento: invoice.dueDate,
        alunoId: invoice.studentId,
        alunoNome: invoice.studentName,
        alunoEmail: invoice.studentEmail,
        alunoTelefone: invoice.studentPhone,
        alunoCpf: cpf,
      },
    });
    return { link: resposta.link, pixCode: resposta.pixCode ?? null, avisoPix: resposta.avisoPix ?? null };
  },
};

/** CPF (11) ou CNPJ (14) com dígitos verificadores certos. */
export function documentoValido(valor: string): boolean {
  const d = valor.replace(/\D/g, '');
  if (d.length === 11) {
    if (/^(\d)\1{10}$/.test(d)) return false;
    const dv = (n: number) => {
      let soma = 0;
      for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
      const r = (soma * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
  }
  if (d.length === 14) {
    if (/^(\d)\1{13}$/.test(d)) return false;
    const dv = (n: number) => {
      const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const soma = pesos.reduce((s, p, i) => s + Number(d[i]) * p, 0);
      const r = soma % 11;
      return r < 2 ? 0 : 11 - r;
    };
    return dv(12) === Number(d[12]) && dv(13) === Number(d[13]);
  }
  return false;
}
