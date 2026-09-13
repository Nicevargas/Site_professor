import { describe, it, expect, vi } from 'vitest';
import { syncResult, reportSyncError, subscribeSyncErrors, explainSyncReason } from './syncNotifier';

describe('aviso de falha de sincronização', () => {
  it('sem erro retorna sucesso e não dispara evento', () => {
    const handler = vi.fn();
    const unsubscribe = subscribeSyncErrors(handler);
    expect(syncResult(null, 'depoimento')).toBe(true);
    expect(syncResult(undefined, 'depoimento')).toBe(true);
    expect(handler).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('com erro retorna falha e avisa quem estiver ouvindo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handler = vi.fn();
    const unsubscribe = subscribeSyncErrors(handler);

    expect(syncResult({ message: 'permission denied for table videos' }, 'vídeo')).toBe(false);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toMatchObject({ entity: 'vídeo', reason: 'permission denied for table videos' });
    unsubscribe();
    warn.mockRestore();
  });

  it('cancelar a inscrição para de receber avisos', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handler = vi.fn();
    const unsubscribe = subscribeSyncErrors(handler);
    unsubscribe();
    reportSyncError('foto', new Error('falhou'));
    expect(handler).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('traduz as causas mais comuns para uma ação', () => {
    expect(explainSyncReason('new row violates row-level security policy')).toMatch(/permiss/i);
    expect(explainSyncReason('column "active" does not exist')).toMatch(/atualiza/i);
    expect(explainSyncReason('JWT expired')).toMatch(/sess/i);
    expect(explainSyncReason('TypeError: Failed to fetch')).toMatch(/conex/i);
    expect(explainSyncReason(undefined)).toMatch(/tente de novo/i);
  });

  it('nunca repassa o texto cru do banco nem usa jargão técnico', () => {
    // Um aluno leu "rode as migrações da pasta supabase/migrations" no
    // celular ao marcar aula. Nenhuma explicação pode soar assim.
    const causas = [
      'new row violates row-level security policy',
      'column "client_since" does not exist',
      'JWT expired',
      'TypeError: Failed to fetch',
      'duplicate key value violates unique constraint',
      undefined,
    ];
    for (const causa of causas) {
      const texto = explainSyncReason(causa);
      expect(texto).not.toMatch(/migra|supabase|row-level|constraint|duplicate|jwt|login está vinculado|banco/i);
    }
  });
});
