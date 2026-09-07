-- ====================================================================
-- SUPABASE MIGRATION: 20260906060000_user_quota.sql
--
-- LIMITE DE USUÁRIOS POR PLANO.
--
-- Os planos passaram a ser por tamanho da conta:
--   Start    R$  99/mês   até  10 usuários
--   Pro      R$ 180/mês   até 100 usuários
--   Premium  R$ 350/mês   até 500 usuários
--
-- "Usuário" é todo mundo com acesso: professores, secretaria e alunos.
-- É o que a faixa "1 a 10 usuários" quer dizer para um personal com nove
-- alunos.
--
-- A regra vive aqui, e não só na tela: bloquear apenas no formulário
-- deixaria a API livre, e o limite viraria sugestão.
--
-- Idempotente.
-- ====================================================================

-- ====================================================================
-- 1. QUANTOS USUÁRIOS TEM A CONTA
--
-- Conta é a empresa quando existe; senão, o tenant do professor.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.account_user_count(
    target_company TEXT,
    target_teacher TEXT
)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COUNT(*)::INTEGER
      FROM public.system_users su
     WHERE su.role <> 'admin'
       AND (
            (target_company IS NOT NULL AND (
                su.company_id = target_company
                OR su.teacher_id IN (SELECT id FROM public.teachers WHERE company_id = target_company)
            ))
         OR (target_company IS NULL AND target_teacher IS NOT NULL AND su.teacher_id = target_teacher)
       );
$$;

-- ====================================================================
-- 2. O PLANO DA CONTA
-- A empresa manda quando existe, igual a effective_plan().
-- ====================================================================
CREATE OR REPLACE FUNCTION public.account_plan(
    target_company TEXT,
    target_teacher TEXT
)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        (SELECT c.plan FROM public.companies c WHERE c.id = target_company),
        public.effective_plan(target_teacher),
        'start'
    );
$$;

CREATE OR REPLACE FUNCTION public.plan_user_limit(plan_tier TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE plan_tier
        WHEN 'premium' THEN 500
        WHEN 'pro'     THEN 100
        ELSE 10
    END;
$$;

-- ====================================================================
-- 3. A TRAVA
--
-- Só no INSERT: mover alguém entre professores da mesma conta não pode
-- esbarrar no limite, e desativar quem já existe também não.
--
-- Admin da plataforma passa: é quem conserta conta travada e faz suporte.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.enforce_user_quota()
RETURNS TRIGGER AS $$
DECLARE
    empresa   TEXT;
    plano     TEXT;
    limite    INTEGER;
    usados    INTEGER;
BEGIN
    -- Admin não consome vaga e não é barrado
    IF NEW.role = 'admin' OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    empresa := COALESCE(
        NEW.company_id,
        (SELECT t.company_id FROM public.teachers t WHERE t.id = NEW.teacher_id)
    );

    -- Sem conta identificável ainda (professor se cadastrando do zero),
    -- não há o que limitar: ele é o primeiro usuário do próprio tenant.
    IF empresa IS NULL AND NEW.teacher_id IS NULL THEN
        RETURN NEW;
    END IF;

    plano  := public.account_plan(empresa, NEW.teacher_id);
    limite := public.plan_user_limit(plano);
    usados := public.account_user_count(empresa, NEW.teacher_id);

    IF usados >= limite THEN
        RAISE EXCEPTION
            'O plano % permite % usuário(s) e a conta já tem %. Suba de plano para cadastrar mais.',
            plano, limite, usados
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_user_quota ON public.system_users;
CREATE TRIGGER enforce_user_quota
    BEFORE INSERT ON public.system_users
    FOR EACH ROW EXECUTE FUNCTION public.enforce_user_quota();

-- ====================================================================
-- 4. REBAIXAR PLANO NÃO PODE DEIXAR A CONTA ACIMA DO LIMITE
--
-- Sem isto, trocar Premium por Start numa academia de 200 usuários
-- deixaria 200 pessoas num plano de 10 -- e a trava do INSERT nunca mais
-- deixaria cadastrar ninguém, sem explicar por quê.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.protect_company_plan_downgrade()
RETURNS TRIGGER AS $$
DECLARE
    usados INTEGER;
    limite INTEGER;
BEGIN
    IF NEW.plan IS DISTINCT FROM OLD.plan THEN
        limite := public.plan_user_limit(NEW.plan);
        usados := public.account_user_count(NEW.id, NULL);
        IF usados > limite THEN
            RAISE EXCEPTION
                'A conta tem % usuário(s) e o plano % permite %. Remova usuários antes de rebaixar.',
                usados, NEW.plan, limite
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_company_plan_downgrade ON public.companies;
CREATE TRIGGER protect_company_plan_downgrade
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.protect_company_plan_downgrade();

CREATE INDEX IF NOT EXISTS idx_system_users_conta
    ON public.system_users(company_id, teacher_id) WHERE role <> 'admin';
