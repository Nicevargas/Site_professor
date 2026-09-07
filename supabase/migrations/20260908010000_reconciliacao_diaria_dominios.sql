-- ====================================================================
-- SUPABASE MIGRATION: 20260908010000_reconciliacao_diaria_dominios.sql
--
-- Todo dia, confere se quem deveria ter endereço tem, e cria o que faltar.
--
-- O gatilho de 20260908000000 é rápido, mas frágil: se a Vercel estiver fora
-- do ar no segundo em que o professor salva o slug, ele fica sem endereço e
-- ninguém percebe -- nem ele, que só descobre quando manda o link para um
-- aluno. Esta varredura é a rede embaixo.
--
-- Ela só acrescenta. O que sobra na Vercel é relatado nos logs da função,
-- nunca apagado: rotina automática não derruba endereço que alguém pôs ali
-- de propósito.
--
-- Depende de private.integracoes, criada na migração anterior.
--
-- Idempotente.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- --------------------------------------------------------------------
-- O que o agendamento chama
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.reconciliar_dominios_vercel()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, net
AS $$
DECLARE
    v_url     TEXT;
    v_segredo TEXT;
BEGIN
    SELECT valor INTO v_url     FROM private.integracoes WHERE chave = 'sync_vercel_domain_url';
    SELECT valor INTO v_segredo FROM private.integracoes WHERE chave = 'sync_vercel_domain_secret';

    IF v_url IS NULL OR v_segredo IS NULL THEN
        RAISE NOTICE 'reconciliação de domínios não configurada: veja private.integracoes';
        RETURN;
    END IF;

    PERFORM net.http_post(
        url     := v_url,
        headers := jsonb_build_object(
            'Content-Type',       'application/json',
            'x-aquagenda-secret', v_segredo
        ),
        body    := jsonb_build_object('acao', 'reconciliar'),
        -- Varredura completa demora mais que um gatilho de uma linha só
        timeout_milliseconds := 60000
    );
END;
$$;

COMMENT ON FUNCTION private.reconciliar_dominios_vercel() IS
    'Pede à Edge Function a varredura completa de endereços. Chamada pelo pg_cron.';

-- --------------------------------------------------------------------
-- O agendamento: 04:10 UTC, ou 01:10 em Brasília
--
-- De madrugada porque a varredura escreve na Vercel, e um erro no meio da
-- noite atrapalha menos do que um erro no meio do dia. O minuto quebrado
-- evita a hora cheia, quando meio mundo agenda tarefa.
-- --------------------------------------------------------------------
DO $$
BEGIN
    PERFORM cron.unschedule('reconciliar-dominios-vercel');
EXCEPTION WHEN OTHERS THEN
    -- Ainda não existia; é a primeira vez que esta migração roda
    NULL;
END $$;

SELECT cron.schedule(
    'reconciliar-dominios-vercel',
    '10 4 * * *',
    $$SELECT private.reconciliar_dominios_vercel()$$
);

-- ====================================================================
-- Para conferir:
--
--   SELECT jobid, schedule, jobname, active FROM cron.job
--    WHERE jobname = 'reconciliar-dominios-vercel';
--
--   SELECT start_time, status, return_message
--     FROM cron.job_run_details
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'reconciliar-dominios-vercel')
--    ORDER BY start_time DESC LIMIT 10;
--
-- Para rodar na hora, sem esperar a madrugada:
--   SELECT private.reconciliar_dominios_vercel();
--
-- O resultado (quantos criados, quais falharam, quais sobraram) sai nos
-- logs da Edge Function, em Edge Functions > sync-vercel-domain > Logs.
-- ====================================================================
