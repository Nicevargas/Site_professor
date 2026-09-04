-- ====================================================================
-- SUPABASE MIGRATION: 20260905000000_teacher_plan_and_addressing.sql
-- Assinatura do professor com o Aquagenda e o endereço público da vitrine.
--
-- Planos e o que cada um libera:
--   start   -> vitrine em aquagenda.com.br/p/<slug>
--   pro     -> vitrine em <slug>.aquagenda.com.br
--   premium -> domínio próprio do professor
--
-- Atenção: a tabela pricing_plans NÃO é isto. Ela guarda os planos que o
-- professor vende aos alunos dele. Esta é a assinatura dele com a plataforma.
-- Idempotente.
-- ====================================================================

-- 1. COLUNAS
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'start';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS custom_domain_status TEXT NOT NULL DEFAULT 'nenhum';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teachers_plan_check') THEN
        ALTER TABLE public.teachers
            ADD CONSTRAINT teachers_plan_check CHECK (plan IN ('start', 'pro', 'premium'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teachers_domain_status_check') THEN
        ALTER TABLE public.teachers
            ADD CONSTRAINT teachers_domain_status_check
            CHECK (custom_domain_status IN ('nenhum', 'pendente', 'verificado', 'erro'));
    END IF;
END $$;

-- 2. IDENTIFICADOR PARA QUEM JÁ ESTÁ CADASTRADO
-- Sem a extensão unaccent, traduzimos os acentos usados em português.
CREATE OR REPLACE FUNCTION public.build_teacher_slug(source TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT trim(both '-' FROM
        regexp_replace(
            lower(
                regexp_replace(
                    translate(
                        coalesce(source, ''),
                        'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
                        'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
                    ),
                    '^(prof|profa|professor|professora|dr|dra|sr|sra)\.?\s+', '', 'i'
                )
            ),
            '[^a-z0-9]+', '-', 'g'
        )
    );
$$;

-- Preenche o slug de quem ainda não tem, resolvendo repetições com sufixo numérico
WITH candidatos AS (
    SELECT
        id,
        NULLIF(public.build_teacher_slug(name), '') AS base,
        row_number() OVER (
            PARTITION BY NULLIF(public.build_teacher_slug(name), '')
            ORDER BY created_at, id
        ) AS posicao
    FROM public.teachers
    WHERE slug IS NULL OR slug = ''
)
UPDATE public.teachers t
SET slug = CASE
        WHEN c.base IS NULL THEN 'professor-' || left(md5(t.id), 6)
        WHEN c.posicao = 1 THEN c.base
        ELSE c.base || '-' || c.posicao
    END,
    updated_at = NOW()
FROM candidatos c
WHERE t.id = c.id;

-- 3. UNICIDADE
CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_slug ON public.teachers(slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_custom_domain ON public.teachers(custom_domain) WHERE custom_domain IS NOT NULL;

-- 4. NORMALIZAÇÃO E TRAVA DE PLANO
-- O plano é a trava de verdade: esconder o campo na tela não impede ninguém
-- de gravar um domínio próprio direto pela API.
CREATE OR REPLACE FUNCTION public.enforce_teacher_addressing()
RETURNS TRIGGER AS $$
BEGIN
    NEW.slug := NULLIF(lower(trim(coalesce(NEW.slug, ''))), '');
    NEW.custom_domain := NULLIF(lower(trim(coalesce(NEW.custom_domain, ''))), '');

    IF NEW.slug IS NOT NULL AND NEW.slug !~ '^[a-z0-9][a-z0-9-]{1,47}$' THEN
        RAISE EXCEPTION 'Identificador inválido: use letras minúsculas, números e hífen.';
    END IF;

    IF NEW.custom_domain IS NOT NULL THEN
        IF coalesce(NEW.plan, 'start') <> 'premium' THEN
            RAISE EXCEPTION 'Domínio próprio exige o plano Premium.';
        END IF;
        IF NEW.custom_domain !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' THEN
            RAISE EXCEPTION 'Domínio inválido: informe apenas o endereço, sem https:// nem barras.';
        END IF;
    ELSE
        NEW.custom_domain_status := 'nenhum';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_teacher_addressing ON public.teachers;
CREATE TRIGGER enforce_teacher_addressing
    BEFORE INSERT OR UPDATE ON public.teachers
    FOR EACH ROW EXECUTE FUNCTION public.enforce_teacher_addressing();

-- 5. SÓ ADMIN TROCA O PLANO
-- Sem isso, o próprio professor sobe de plano gravando na tabela.
CREATE OR REPLACE FUNCTION public.protect_teacher_plan()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.plan IS DISTINCT FROM OLD.plan
       AND auth.uid() IS NOT NULL
       AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Somente um administrador pode alterar o plano do professor.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_teacher_plan ON public.teachers;
CREATE TRIGGER protect_teacher_plan
    BEFORE UPDATE ON public.teachers
    FOR EACH ROW EXECUTE FUNCTION public.protect_teacher_plan();

-- 6. BUSCA PÚBLICA PELA VITRINE
-- A vitrine é aberta e resolve o professor antes de qualquer login.
-- A política teachers_public_read já permite o SELECT; aqui só garantimos o índice.
CREATE INDEX IF NOT EXISTS idx_teachers_plan ON public.teachers(plan);
