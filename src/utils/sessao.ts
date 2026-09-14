import { AuthUser } from '../types';

/**
 * Quem está logado, e em quem se pode confiar para saber.
 *
 * O app guardava o usuário no navegador e, ao abrir, mostrava o painel com
 * essa cópia -- sem esperar o servidor confirmar o login. Sessão expirada,
 * saída em outra aba, celular de outra pessoa: o painel abria do mesmo jeito.
 * E como a cópia do navegador é editável, bastava trocar "professor" por
 * "admin" nela para a tela se abrir como administrador.
 *
 * Com o banco ligado, a cópia do navegador não vale como login. Só o servidor
 * diz quem está dentro. Sem banco (modo demonstração) não há servidor para
 * perguntar, e a cópia continua sendo o único registro.
 */

export const CHAVE_USUARIO = 'agenda_prof_current_user';

export function usuarioGuardado(
  armazenamento: Pick<Storage, 'getItem'> | null | undefined,
  bancoLigado: boolean
): AuthUser | null {
  if (bancoLigado) return null;
  try {
    const salvo = armazenamento?.getItem(CHAVE_USUARIO);
    return salvo ? (JSON.parse(salvo) as AuthUser) : null;
  } catch {
    return null;
  }
}

/** Sessão ausente, ou sem usuário dentro, é acesso encerrado. */
export function sessaoEncerrada(sessao: { user?: unknown } | null | undefined): boolean {
  return !sessao || !sessao.user;
}
