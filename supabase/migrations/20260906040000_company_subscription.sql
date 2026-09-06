-- ====================================================================
-- SUPABASE MIGRATION: 20260906040000_company_subscription.sql
--
-- A ASSINATURA PASSA A SER DA EMPRESA.
--
-- Até aqui o plano vivia só em teachers.plan, o que só faz sentido para
-- professor autônomo. Numa academia com cinco professores, quem assina é
-- a academia -- e cobrar cinco assinaturas separadas, ou eleger um
-- professor como "o pagante", seriam os dois errados.
--
-- Regra: a empresa manda quando existe. O plano efetivo de um professor é
--   COALESCE(plano da empresa dele, plano dele)
-- Assim a academia assina uma vez e cobre todos os professores, e o
-- professor autônomo continua com a assinatura própria, sem mudar nada.
--
-- Feito agora DE PROPÓSITO, enquanto não há cliente pagando: depois disso
-- mover a identidade da cobrança significa mexer em histórico financeiro.
--
-- Idempotente.
-- ====================================================================

-- ====================================================================
-- 1. A COLUNA
-- ====================================================================
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'start';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_plan_check') THEN
        ALTER TABLE public.companies
            ADD CONSTRAINT companies_plan_check CHECK (plan IN ('start', 'pro', 'premium'));
    END IF;
END $$;

COMMENT ON COLUMN public.companies.plan IS
    'Assinatura da academia com o Aquagenda. Vale para todos os professores dela e vence o teachers.plan individual.';

COMMENT ON COLUMN public.teachers.plan IS
    'Assinatura do professor autônomo. Ignorada quando ele pertence a uma empresa: ali vale companies.plan.';

-- ====================================================================
-- 2. O PLANO EFETIVO
-- Uma função só, para que banco e aplicação nunca discordem sobre qual
-- plano vale para um professor.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.effective_plan(target_teacher TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(
        (SELECT c.plan
           FROM public.teachers t
           JOIN public.companies c ON c.id = t.company_id
          WHERE t.id = target_teacher),
        (SELECT t.plan FROM public.teachers t WHERE t.id = target_teacher),
        'start'
    );
$$;

-- ====================================================================
-- 3. DOMÍNIO PRÓPRIO PASSA A OLHAR O PLANO EFETIVO
--
-- Antes a regra lia NEW.plan, o plano individual. Um professor de uma
-- academia Premium ficava barrado de usar domínio próprio porque o campo
-- dele continuava 'start'.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.enforce_teacher_addressing()
RETURNS TRIGGER AS $$
DECLARE
    plano_valido TEXT;
BEGIN
    NEW.slug := NULLIF(lower(trim(coalesce(NEW.slug, ''))), '');
    NEW.custom_domain := NULLIF(lower(trim(coalesce(NEW.custom_domain, ''))), '');

    IF NEW.slug IS NOT NULL AND NEW.slug !~ '^[a-z0-9][a-z0-9-]{1,47}$' THEN
        RAISE EXCEPTION 'Identificador inválido: use letras minúsculas, números e hífen.';
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
-- 4. SÓ ADMIN MUDA O PLANO DA EMPRESA
--
-- Mesma regra que já vale para teachers.plan: quem contrata é a
-- plataforma, não o cliente pela tela. Sem isto, o gestor -- que tem
-- UPDATE na própria empresa desde a Fase 2 -- daria a si mesmo o Premium.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.protect_company_privileges()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
        IF NEW.manager_sees_finance IS DISTINCT FROM OLD.manager_sees_finance THEN
            RAISE EXCEPTION 'Somente um administrador da plataforma pode mudar o acesso do gestor ao financeiro.';
        END IF;
        IF NEW.plan IS DISTINCT FROM OLD.plan THEN
            RAISE EXCEPTION 'Somente um administrador da plataforma pode alterar o plano da empresa.';
        END IF;
        IF NEW.id IS DISTINCT FROM OLD.id THEN
            RAISE EXCEPTION 'O identificador da empresa não pode ser alterado.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_company_privileges ON public.companies;
CREATE TRIGGER protect_company_privileges
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.protect_company_privileges();

-- ====================================================================
-- 5. HERANÇA PARA QUEM JÁ ESTÁ NO BANCO
--
-- Se alguma empresa já tem professor em plano melhor que o dela, a
-- empresa sobe para o maior deles -- ninguém perde o que já usava por
-- causa desta migração. Com zero cliente pagando isso não deve mexer em
-- nada, e é justamente por isso que a hora de fazer é agora.
-- ====================================================================
DO $$
DECLARE
    r          RECORD;
    rank_atual INTEGER;
    ajustadas  INTEGER := 0;
BEGIN
    FOR r IN
        SELECT c.id,
               c.plan AS plano_empresa,
               MAX(CASE t.plan WHEN 'premium' THEN 3 WHEN 'pro' THEN 2 ELSE 1 END) AS maior
          FROM public.companies c
          JOIN public.teachers t ON t.company_id = c.id
         GROUP BY c.id, c.plan
    LOOP
        -- O rank sai para uma variavel de proposito: um CASE dentro da
        -- condicao do IF quebra, porque o PL/pgSQL fecha a condicao no
        -- primeiro THEN que encontra -- inclusive o THEN do proprio CASE.
        rank_atual := CASE r.plano_empresa WHEN 'premium' THEN 3 WHEN 'pro' THEN 2 ELSE 1 END;

        IF r.maior > rank_atual THEN
            UPDATE public.companies
               SET plan = CASE r.maior WHEN 3 THEN 'premium' WHEN 2 THEN 'pro' ELSE 'start' END,
                   updated_at = NOW()
             WHERE id = r.id;
            ajustadas := ajustadas + 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'Empresas que herdaram o plano do professor mais alto: %.', ajustadas;
END $$;

CREATE INDEX IF NOT EXISTS idx_companies_plan ON public.companies(plan);
