-- ====================================================================
-- SUPABASE MIGRATION: 20260906050000_company_public_site.sql
--
-- A ACADEMIA GANHA VITRINE PRÓPRIA.
--
-- Decisão: existem as duas páginas, e a da academia é a porta de entrada.
-- Quem procura "Academia Aqua Vida" cai numa página da academia com os
-- professores dela; quem recebe o link de um professor cai na página dele.
-- A marca da academia NÃO sobrescreve a do professor: apagar a vitrine que
-- ele configurou seria pior do que não ter página de academia nenhuma.
--
-- Endereços:
--   /e/<slug>            academia        (professor continua em /p/<slug>)
--   <slug>.aquagenda...  academia OU professor, resolvido por consulta
--   dominio-proprio      academia OU professor, idem
--
-- Idempotente.
-- ====================================================================

-- ====================================================================
-- 1. ENDEREÇO E MARCA DA ACADEMIA
-- ====================================================================
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS slug                 TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS custom_domain        TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS custom_domain_status TEXT NOT NULL DEFAULT 'nenhum';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS headline             TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS bio                  TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS whatsapp             TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hero_image_url       TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS primary_color        TEXT DEFAULT '#00687a';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS secondary_color      TEXT DEFAULT '#57dffe';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS accent_color         TEXT DEFAULT '#004e5c';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_domain_status_check') THEN
        ALTER TABLE public.companies
            ADD CONSTRAINT companies_domain_status_check
            CHECK (custom_domain_status IN ('nenhum', 'pendente', 'verificado', 'erro'));
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_slug
    ON public.companies(slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_custom_domain
    ON public.companies(custom_domain) WHERE custom_domain IS NOT NULL;

-- ====================================================================
-- 2. IDENTIFICADOR PARA AS EMPRESAS QUE JÁ EXISTEM
-- ====================================================================
UPDATE public.companies c
   SET slug = sub.candidato
  FROM (
      SELECT id,
             CASE WHEN rn = 1 THEN base ELSE base || '-' || rn END AS candidato
        FROM (
            SELECT id,
                   COALESCE(NULLIF(public.build_teacher_slug(name), ''), 'academia') AS base,
                   ROW_NUMBER() OVER (
                       PARTITION BY COALESCE(NULLIF(public.build_teacher_slug(name), ''), 'academia')
                       ORDER BY created_at, id
                   ) AS rn
              FROM public.companies
             WHERE slug IS NULL OR slug = ''
        ) numerado
  ) sub
 WHERE c.id = sub.id;

-- ====================================================================
-- 3. UM SLUG, UM DONO
--
-- Academia e professor dividem o mesmo espaço em subdomínio e domínio
-- próprio: sem esta trava, "aquavida.aquagenda.com.br" poderia existir
-- nas duas tabelas e o site resolveria para qualquer um dos dois.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.enforce_company_addressing()
RETURNS TRIGGER AS $$
BEGIN
    NEW.slug := NULLIF(lower(trim(coalesce(NEW.slug, ''))), '');
    NEW.custom_domain := NULLIF(lower(trim(coalesce(NEW.custom_domain, ''))), '');

    IF NEW.slug IS NOT NULL THEN
        IF NEW.slug !~ '^[a-z0-9][a-z0-9-]{1,47}$' THEN
            RAISE EXCEPTION 'Identificador inválido: use letras minúsculas, números e hífen.';
        END IF;
        IF EXISTS (SELECT 1 FROM public.teachers t WHERE t.slug = NEW.slug) THEN
            RAISE EXCEPTION 'Este endereço já é de um professor. Escolha outro para a academia.';
        END IF;
    END IF;

    IF NEW.custom_domain IS NOT NULL THEN
        IF COALESCE(NEW.plan, 'start') <> 'premium' THEN
            RAISE EXCEPTION 'Domínio próprio exige o plano Premium.';
        END IF;
        IF NEW.custom_domain !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' THEN
            RAISE EXCEPTION 'Domínio inválido: informe apenas o endereço, sem https:// nem barras.';
        END IF;
        IF EXISTS (SELECT 1 FROM public.teachers t WHERE t.custom_domain = NEW.custom_domain) THEN
            RAISE EXCEPTION 'Este domínio já está em uso por um professor.';
        END IF;
    ELSE
        NEW.custom_domain_status := 'nenhum';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_company_addressing ON public.companies;
CREATE TRIGGER enforce_company_addressing
    BEFORE INSERT OR UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.enforce_company_addressing();

-- A trava vale nos dois sentidos: o professor também não toma o endereço
-- de uma academia.
CREATE OR REPLACE FUNCTION public.enforce_teacher_addressing()
RETURNS TRIGGER AS $$
DECLARE
    plano_valido TEXT;
BEGIN
    NEW.slug := NULLIF(lower(trim(coalesce(NEW.slug, ''))), '');
    NEW.custom_domain := NULLIF(lower(trim(coalesce(NEW.custom_domain, ''))), '');

    IF NEW.slug IS NOT NULL THEN
        IF NEW.slug !~ '^[a-z0-9][a-z0-9-]{1,47}$' THEN
            RAISE EXCEPTION 'Identificador inválido: use letras minúsculas, números e hífen.';
        END IF;
        IF EXISTS (SELECT 1 FROM public.companies c WHERE c.slug = NEW.slug) THEN
            RAISE EXCEPTION 'Este endereço já é de uma academia. Escolha outro.';
        END IF;
    END IF;

    IF NEW.custom_domain IS NOT NULL THEN
        -- A empresa manda; sem empresa, vale o plano do próprio professor
        plano_valido := COALESCE(
            (SELECT c.plan FROM public.companies c WHERE c.id = NEW.company_id),
            NEW.plan,
            'start'
        );

        IF plano_valido <> 'premium' THEN
            RAISE EXCEPTION 'Domínio próprio exige o plano Premium.';
        END IF;
        IF NEW.custom_domain !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' THEN
            RAISE EXCEPTION 'Domínio inválido: informe apenas o endereço, sem https:// nem barras.';
        END IF;
        IF EXISTS (SELECT 1 FROM public.companies c WHERE c.custom_domain = NEW.custom_domain) THEN
            RAISE EXCEPTION 'Este domínio já está em uso por uma academia.';
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

-- ====================================================================
-- 4. A VITRINE DA ACADEMIA É PÚBLICA
--
-- companies_read exigia login: um visitante anônimo não conseguiria
-- carregar a página da academia. A leitura passa a ser aberta, como já
-- acontece com teachers_public_read. Escrita segue restrita.
-- ====================================================================
DROP POLICY IF EXISTS companies_read ON public.companies;
CREATE POLICY companies_read ON public.companies
    FOR SELECT USING (TRUE);
