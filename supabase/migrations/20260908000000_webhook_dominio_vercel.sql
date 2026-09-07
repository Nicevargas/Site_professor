-- ====================================================================
-- SUPABASE MIGRATION: 20260908000000_webhook_dominio_vercel.sql
--
-- Quando um professor ou academia ganha (ou troca) o endereço, avisa a
-- Edge Function sync-vercel-domain, que registra o nome na Vercel.
--
-- O DNS já resolve qualquer subdomínio por causa do curinga na zona. O que
-- falta é a Vercel conhecer o nome -- ela roteia pelo cabeçalho Host, e nome
-- desconhecido devolve DEPLOYMENT_NOT_FOUND. Sem isto, cada professor novo
-- exigiria alguém abrir o painel da Vercel à mão.
--
-- A URL e o segredo NÃO ficam neste arquivo: ficam em private.integracoes,
-- que você preenche uma vez pelo SQL Editor. Segredo em migração é segredo
-- no histórico do git, e de lá não sai mais.
--
-- Idempotente.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

-- --------------------------------------------------------------------
-- Onde os segredos moram
--
-- Schema private não é exposto pela API REST, então nem anon nem
-- authenticated enxergam esta tabela -- ao contrário de qualquer coisa em
-- public, que o PostgREST publica.
-- --------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.integracoes (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

REVOKE ALL ON SCHEMA private FROM anon, authenticated;
REVOKE ALL ON private.integracoes FROM anon, authenticated;

COMMENT ON TABLE private.integracoes IS
    'Segredos de integração. Nunca versionados. Preencher pelo SQL Editor.';

-- --------------------------------------------------------------------
-- O gatilho
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.avisar_sync_vercel_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, net
AS $$
DECLARE
    v_url     TEXT;
    v_segredo TEXT;
    novo      JSONB := to_jsonb(NEW);
    velho     JSONB := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END;
BEGIN
    SELECT valor INTO v_url     FROM private.integracoes WHERE chave = 'sync_vercel_domain_url';
    SELECT valor INTO v_segredo FROM private.integracoes WHERE chave = 'sync_vercel_domain_secret';

    -- Sem configuração, o gatilho não faz nada. Assim a migração pode rodar
    -- antes de a função existir, sem quebrar cadastro de professor.
    IF v_url IS NULL OR v_segredo IS NULL THEN
        RETURN NEW;
    END IF;

    -- Só chama quando mudou algo que muda o endereço. Sem isto, salvar a cor
    -- do tema dispararia uma chamada à Vercel.
    --
    -- A comparação é em JSONB, e não em NEW.company_id, porque o mesmo gatilho
    -- serve teachers e companies -- e companies não tem essa coluna.
    IF velho IS NOT NULL
       AND novo -> 'slug'          IS NOT DISTINCT FROM velho -> 'slug'
       AND novo -> 'plan'          IS NOT DISTINCT FROM velho -> 'plan'
       AND novo -> 'custom_domain' IS NOT DISTINCT FROM velho -> 'custom_domain'
       AND novo -> 'company_id'    IS NOT DISTINCT FROM velho -> 'company_id'
    THEN
        RETURN NEW;
    END IF;

    -- Assíncrono de propósito: a Vercel fora do ar não pode impedir alguém de
    -- salvar o perfil. Quem conserta o que falhar é a reconciliação.
    PERFORM net.http_post(
        url     := v_url,
        headers := jsonb_build_object(
            'Content-Type',       'application/json',
            'x-aquagenda-secret', v_segredo
        ),
        body    := jsonb_build_object(
            'type',       TG_OP,
            'table',      TG_TABLE_NAME,
            'record',     novo,
            'old_record', velho
        ),
        timeout_milliseconds := 5000
    );

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION private.avisar_sync_vercel_domain() IS
    'Avisa a Edge Function sync-vercel-domain quando o endereço de um professor ou academia muda.';

DROP TRIGGER IF EXISTS trg_sync_vercel_domain ON public.teachers;
CREATE TRIGGER trg_sync_vercel_domain
    AFTER INSERT OR UPDATE ON public.teachers
    FOR EACH ROW EXECUTE FUNCTION private.avisar_sync_vercel_domain();

DROP TRIGGER IF EXISTS trg_sync_vercel_domain ON public.companies;
CREATE TRIGGER trg_sync_vercel_domain
    AFTER INSERT OR UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION private.avisar_sync_vercel_domain();

-- ====================================================================
-- DEPOIS DE RODAR ESTA MIGRAÇÃO, configure os dois valores.
-- Rode no SQL Editor, trocando o que está entre <>:
--
--   INSERT INTO private.integracoes (chave, valor) VALUES
--     ('sync_vercel_domain_url',
--      'https://<REF-DO-PROJETO>.supabase.co/functions/v1/sync-vercel-domain'),
--     ('sync_vercel_domain_secret', '<UM-SEGREDO-LONGO-QUE-VOCE-INVENTA>')
--   ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = now();
--
-- O MESMO segredo vai em Edge Functions > Secrets como WEBHOOK_SECRET.
--
-- Para conferir se está ligado:
--   SELECT chave, atualizado_em FROM private.integracoes;
--   SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname = 'trg_sync_vercel_domain';
-- ====================================================================
