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
    expect(explainSyncReason('column "active" does not exist')).toMatch(/migra/i);
    expect(explainSyncReason('JWT expired')).toMatch(/sess/i);
    expect(explainSyncReason('TypeError: Failed to fetch')).toMatch(/conex/i);
    expect(explainSyncReason('algo inesperado')).toBe('algo inesperado');
    expect(explainSyncReason(undefined)).toMatch(/sem detalhes/i);
  });
});
