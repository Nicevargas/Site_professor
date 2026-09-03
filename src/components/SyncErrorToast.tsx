import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import { subscribeSyncErrors, explainSyncReason, SyncErrorDetail } from '../utils/syncNotifier';
import { isSupabaseConfigured } from '../lib/supabase';

const AUTO_DISMISS_MS = 12000;

/**
 * Aviso fixo no rodapé quando uma gravação no Supabase falha.
 * Só faz sentido com o banco configurado; no modo demonstração nada é gravado.
 */
export const SyncErrorToast: React.FC = () => {
  const [errors, setErrors] = useState<SyncErrorDetail[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    return subscribeSyncErrors((detail) => {
      setErrors((prev) => {
        // Agrupa falhas repetidas da mesma entidade em um único aviso
        const withoutSame = prev.filter((e) => e.entity !== detail.entity);
        return [...withoutSame, detail].slice(-3);
      });
      window.setTimeout(() => {
        setErrors((prev) => prev.filter((e) => e.at !== detail.at));
      }, AUTO_DISMISS_MS);
    });
  }, []);

  if (errors.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-lg space-y-2"
      role="status"
      aria-live="polite"
    >
      {errors.map((err) => (
        <div
          key={err.at}
          className="bg-[#fff4f4] border border-rose-300 text-rose-900 rounded-2xl shadow-elevated p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Não foi possível salvar: {err.entity}</p>
            <p className="text-xs mt-0.5 text-rose-800">{explainSyncReason(err.reason)}</p>
            <p className="text-[11px] mt-1 text-rose-700/80">
              A alteração ficou apenas neste navegador e será perdida ao recarregar a página.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-800 hover:underline"
            >
              <RefreshCw className="w-3 h-3" />
              Recarregar e tentar de novo
            </button>
          </div>
          <button
            type="button"
            onClick={() => setErrors((prev) => prev.filter((e) => e.at !== err.at))}
            className="p-1 rounded-lg text-rose-500 hover:text-rose-800 hover:bg-rose-100 transition-colors"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
