/**
 * Aviso de falha de sincronização com o banco (Supabase).
 * As gravações são feitas em segundo plano; quando uma falha, o serviço dispara
 * um evento e o SyncErrorToast mostra o aviso na tela.
 */

export const SYNC_ERROR_EVENT = 'aquagenda:sync-error';

/**
 * Motivo de uma gravação que nem chegou ao banco: o app não sabia de qual
 * professor era o registro. Tem mensagem própria porque o aviso de permissão
 * mandaria a pessoa procurar um problema de acesso que ela não tem.
 */
export const PROFESSOR_DESCONHECIDO = 'professor-desconhecido';

export interface SyncErrorDetail {
  /** O que não foi salvo, em linguagem do usuário (ex.: "depoimento", "agendamento") */
  entity: string;
  /** Mensagem técnica retornada pelo banco ou pela rede */
  reason?: string;
  at: number;
}

export function reportSyncError(entity: string, reason?: unknown): void {
  const detail: SyncErrorDetail = {
    entity,
    reason: reason ? String(reason instanceof Error ? reason.message : reason) : undefined,
    at: Date.now(),
  };
  console.warn(`Falha ao sincronizar ${entity} com o Supabase:`, detail.reason);
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent<SyncErrorDetail>(SYNC_ERROR_EVENT, { detail }));
  }
}

/**
 * Converte o `error` de uma escrita do Supabase em booleano de sucesso,
 * avisando o usuário quando falhar.
 */
export function syncResult(error: { message?: string } | null | undefined, entity: string): boolean {
  if (error) {
    reportSyncError(entity, error.message || error);
    return false;
  }
  return true;
}

export function subscribeSyncErrors(handler: (detail: SyncErrorDetail) => void): () => void {
  const listener = (event: Event) => handler((event as CustomEvent<SyncErrorDetail>).detail);
  window.addEventListener(SYNC_ERROR_EVENT, listener);
  return () => window.removeEventListener(SYNC_ERROR_EVENT, listener);
}

/**
 * O motivo da falha, em palavras que qualquer pessoa entende.
 *
 * Antes as mensagens falavam a língua de quem mantém o sistema: "rode as
 * migrações da pasta supabase/migrations", "confira se o seu login está
 * vinculado ao professor em Usuários". Um aluno marcando aula leu isso no
 * celular. Ninguém fora da equipe técnica sabe o que fazer com essas frases,
 * e boa parte da equipe também não.
 *
 * Cada explicação diz o que aconteceu e o que a pessoa pode fazer. O texto
 * cru do banco nunca aparece: ele é o que ninguém entende.
 */
export function explainSyncReason(reason?: string): string {
  if (!reason) return 'Tente de novo em alguns instantes.';
  if (reason === PROFESSOR_DESCONHECIDO) {
    return 'Não conseguimos identificar seu perfil de professor. Saia e entre de novo; se continuar, fale com o responsável pela conta.';
  }
  const r = reason.toLowerCase();
  if (r.includes('row-level security') || r.includes('violates row-level') || r.includes('permission denied')) {
    return 'Você não tem permissão para salvar isto. Se não deveria ser assim, fale com o responsável pela conta.';
  }
  if (r.includes('does not exist') || r.includes('column')) {
    return 'O sistema precisa de uma atualização para guardar isto. Avise o suporte.';
  }
  if (r.includes('jwt') || r.includes('expired') || r.includes('not authenticated')) {
    return 'Sua sessão terminou. Saia e entre de novo.';
  }
  if (r.includes('failed to fetch') || r.includes('network') || r.includes('timeout')) {
    return 'Sem conexão com a internet no momento. Confira e tente de novo.';
  }
  return 'Aconteceu um erro inesperado. Tente de novo em alguns instantes.';
}
