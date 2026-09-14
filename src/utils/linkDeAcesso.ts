import { traduzirErroDeAcesso } from './erroDeAcesso';

/**
 * O que o link do e-mail trouxe no endereço.
 *
 * O link de "Esqueci minha senha" chega com a sessão no endereço
 * (#access_token=...&type=recovery). O Supabase lê isso, guarda a sessão,
 * apaga o endereço e só DEPOIS avisa que era uma redefinição. Nesse meio
 * tempo o app via uma sessão válida e abria o painel -- a pessoa entrava sem
 * criar senha nova.
 *
 * Por isso o endereço é lido aqui, quando o módulo carrega, antes de o
 * Supabase começar. lib/supabase importa este arquivo para garantir a ordem.
 *
 * Link vencido ou já usado volta com #error_code=otp_expired: vira aviso em
 * português na tela de entrar.
 */

export interface LinkDeAcesso {
  /** Chegou pelo link de redefinição de senha */
  recuperacao: boolean;
  /** Aviso para a pessoa, quando o link voltou com erro */
  erro: string | null;
}

export function lerLinkDeAcesso(hash: string, search: string): LinkDeAcesso {
  const partes = new URLSearchParams();
  for (const bruto of [search.replace(/^\?/, ''), hash.replace(/^#\/?/, '')]) {
    new URLSearchParams(bruto).forEach((valor, chave) => partes.set(chave, valor));
  }

  const erroNoLink = partes.get('error_code') || partes.get('error_description') || partes.get('error');
  if (erroNoLink) {
    return {
      recuperacao: false,
      erro: traduzirErroDeAcesso([partes.get('error_code'), partes.get('error_description'), partes.get('error')].filter(Boolean).join(' ')),
    };
  }

  const recuperacao = partes.get('type') === 'recovery' && Boolean(partes.get('access_token'));
  return { recuperacao, erro: null };
}

export const LINK_DE_ACESSO: LinkDeAcesso =
  typeof window !== 'undefined'
    ? lerLinkDeAcesso(window.location.hash, window.location.search)
    : { recuperacao: false, erro: null };
