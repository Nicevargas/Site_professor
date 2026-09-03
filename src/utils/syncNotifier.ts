/**
 * Aviso de falha de sincronização com o banco (Supabase).
 * As gravações são feitas em segundo plano; quando uma falha, o serviço dispara
 * um evento e o SyncErrorToast mostra o aviso na tela.
 */

export const SYNC_ERROR_EVENT = 'aquagenda:sync-error';

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

/** Traduz mensagens técnicas frequentes do Supabase para algo acionável. */
export function explainSyncReason(reason?: string): string {
  if (!reason) return 'Sem detalhes do erro.';
  const r = reason.toLowerCase();
  if (r.includes('row-level security') || r.includes('violates row-level') || r.includes('permission denied')) {
    return 'O banco recusou a gravação por permissão. Confira se o seu login está vinculado ao professor em "Usuários".';
  }
  if (r.includes('does not exist') || r.includes('column')) {
    return 'O banco está desatualizado: rode as migrações da pasta supabase/migrations.';
  }
  if (r.includes('jwt') || r.includes('expired') || r.includes('not authenticated')) {
    return 'Sua sessão expirou. Saia e entre novamente.';
  }
  if (r.includes('failed to fetch') || r.includes('network') || r.includes('timeout')) {
    return 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
  }
  return reason;
}
