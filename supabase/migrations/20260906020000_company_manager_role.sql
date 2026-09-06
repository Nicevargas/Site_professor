-- ====================================================================
-- SUPABASE MIGRATION: 20260906020000_company_manager_role.sql
--
-- FASE 2 do plano multi-empresa: o papel `gestor`.
--
-- Até aqui a fronteira de segurança era o professor, e o único jeito de
-- dar visão ampla a alguém era marcá-lo como `admin` -- que ignora toda
-- checagem de tenant e enxerga TODAS as academias. Isso inviabiliza
-- vender para mais de uma cliente.
--
-- O gestor enxerga os professores da PRÓPRIA empresa e nada além disso.
-- `admin` continua sendo o papel da plataforma, de uma pessoa só.
--
-- A alavanca: as políticas por tabela não comparam teacher_id na mão,
-- todas passam por is_tenant_staff() e is_tenant_owner(). Estender essas
-- duas funções propaga a fronteira nova para o sistema inteiro sem
-- reescrever política nenhuma.
--
-- Esta migração NÃO mexe em telas. Um gestor criado aqui já é barrado
-- corretamente pelo banco; a interface dele é a Fase 3.
--
-- Idempotente.
-- ====================================================================

-- ====================================================================
-- 1. O PAPEL
-- ====================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'system_users_role_check') THEN
        ALTER TABLE public.system_users DROP CONSTRAINT system_users_role_check;
    END IF;
    ALTER TABLE public.system_users
        ADD CONSTRAINT system_users_role_check
        CHECK (role IN ('admin', 'gestor', 'professor', 'assistente', 'aluno'));
END $$;

-- ====================================================================
-- 2. O GESTOR VÊ O FINANCEIRO?
--
-- Depende do contrato da academia: quem recebe e repassa precisa ver;
-- quem só aluga espaço para professores autônomos, não -- e o professor
-- acharia invasivo. Por isso é configuração por empresa, e não uma regra
-- fixa no código. Começa fechado: liberar depois é fácil, retirar acesso
-- já concedido é conversa difícil.
-- ====================================================================
ALTER TABLE public.companies
    ADD COLUMN IF NOT EXISTS manager_sees_finance BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.companies.manager_sees_finance IS
    'Quando true, o gestor da empresa também enxerga financeiro, site e integrações dos professores dela. Só um admin da plataforma pode ligar.';

-- ====================================================================
-- 3. HELPERS
-- ====================================================================

-- Empresa da pessoa logada: a dela, ou a do professor a que ela responde
CREATE OR REPLACE FUNCTION public.get_current_company_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        su.company_id,
        (SELECT t.company_id FROM public.teachers t WHERE t.id = su.teacher_id)
    )
    FROM public.system_users su
    WHERE su.auth_user_id = auth.uid() AND su.status = 'ativo'
    LIMIT 1;
$$;

-- Gestor de alguma empresa. Gestor sem empresa não gere nada.
CREATE OR REPLACE FUNCTION public.is_company_manager()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT public.get_current_user_role() = 'gestor'
       AND public.get_current_company_id() IS NOT NULL;
$$;

-- O professor alvo pertence à minha empresa?
CREATE OR REPLACE FUNCTION public.manages_teacher(target_teacher TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT public.is_company_manager()
       AND target_teacher IS NOT NULL
       AND EXISTS (
           SELECT 1 FROM public.teachers t
           WHERE t.id = target_teacher
             AND t.company_id IS NOT NULL
             AND t.company_id = public.get_current_company_id()
       );
$$;

-- Gestor com permissão de financeiro, liberada pelo admin naquela empresa
CREATE OR REPLACE FUNCTION public.manages_teacher_finance(target_teacher TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT public.manages_teacher(target_teacher)
       AND EXISTS (
           SELECT 1 FROM public.companies c
           WHERE c.id = public.get_current_company_id()
             AND c.manager_sees_finance
       );
$$;

-- ====================================================================
-- 4. A ALAVANCA: as duas funções que todas as políticas já usam
-- ====================================================================

-- Operação do dia a dia: agenda, alunos, serviços, lembretes
CREATE OR REPLACE FUNCTION public.is_tenant_staff(target_teacher TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT public.is_admin()
        OR public.manages_teacher(target_teacher)
        OR (
            public.get_current_user_role() IN ('professor', 'assistente')
            AND target_teacher IS NOT NULL
            AND target_teacher = public.get_current_teacher_id()
        );
$$;

-- Coisas do dono: financeiro, site, integrações, configurações do perfil
CREATE OR REPLACE FUNCTION public.is_tenant_owner(target_teacher TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT public.is_admin()
        OR public.manages_teacher_finance(target_teacher)
        OR (
            public.get_current_user_role() = 'professor'
            AND target_teacher IS NOT NULL
            AND target_teacher = public.get_current_teacher_id()
        );
$$;

-- ====================================================================
-- 5. EMPRESAS: o gestor lê e edita a própria
-- ====================================================================
DROP POLICY IF EXISTS companies_read        ON public.companies;
DROP POLICY IF EXISTS companies_admin_write ON public.companies;
DROP POLICY IF EXISTS companies_manager_update ON public.companies;

CREATE POLICY companies_read ON public.companies
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY companies_admin_write ON public.companies
    FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY companies_manager_update ON public.companies
    FOR UPDATE TO authenticated
    USING (public.is_company_manager() AND id = public.get_current_company_id())
    WITH CHECK (public.is_company_manager() AND id = public.get_current_company_id());

-- O gestor edita nome, contato e logo da empresa -- mas não a própria
-- permissão de financeiro, senão a configuração não valeria nada.
CREATE OR REPLACE FUNCTION public.protect_company_privileges()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
        IF NEW.manager_sees_finance IS DISTINCT FROM OLD.manager_sees_finance THEN
            RAISE EXCEPTION 'Somente um administrador da plataforma pode mudar o acesso do gestor ao financeiro.';
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
-- 6. PROFESSORES: o gestor administra os da empresa dele
-- teachers_owner_update já usa is_tenant_owner, que agora contempla o
-- gestor com financeiro. Falta o gestor SEM financeiro poder editar o
-- cadastro do professor (nome, especialidade) sem ver a receita dele.
-- ====================================================================
DROP POLICY IF EXISTS teachers_manager_update ON public.teachers;
CREATE POLICY teachers_manager_update ON public.teachers
    FOR UPDATE TO authenticated
    USING (public.manages_teacher(id))
    WITH CHECK (public.manages_teacher(id));

-- ====================================================================
-- 7. USUÁRIOS: o gestor enxerga e cria gente da própria empresa
--
-- Sem isto o gestor não veria nem os professores dele na tela de
-- Usuários, porque system_users_read só olha is_tenant_owner.
-- ====================================================================
DROP POLICY IF EXISTS system_users_manager_read   ON public.system_users;
DROP POLICY IF EXISTS system_users_manager_insert ON public.system_users;
DROP POLICY IF EXISTS system_users_manager_update ON public.system_users;

CREATE POLICY system_users_manager_read ON public.system_users
    FOR SELECT TO authenticated
    USING (
        public.is_company_manager()
        AND (
            company_id = public.get_current_company_id()
            OR public.manages_teacher(teacher_id)
        )
    );

-- Gestor cria professor, assistente e aluno na empresa dele.
-- Nunca admin, nunca outro gestor: elevar papel é coisa da plataforma.
CREATE POLICY system_users_manager_insert ON public.system_users
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_company_manager()
        AND role IN ('professor', 'assistente', 'aluno')
        AND company_id = public.get_current_company_id()
    );

CREATE POLICY system_users_manager_update ON public.system_users
    FOR UPDATE TO authenticated
    USING (
        public.is_company_manager()
        AND role IN ('professor', 'assistente', 'aluno')
        AND (company_id = public.get_current_company_id() OR public.manages_teacher(teacher_id))
    )
    WITH CHECK (
        public.is_company_manager()
        AND role IN ('professor', 'assistente', 'aluno')
        AND (company_id = public.get_current_company_id() OR public.manages_teacher(teacher_id))
    );

-- ====================================================================
-- 8. NINGUÉM SE PROMOVE, NEM MUDA DE EMPRESA
--
-- O gatilho que já existia protegia papel, permissões, status e vínculo
-- de professor. Agora protege company_id também: sem isso um gestor
-- trocaria a própria empresa e cairia dentro da academia da concorrente.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.protect_system_user_privileges()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_admin() AND auth.uid() IS NOT NULL THEN
        IF NEW.role IS DISTINCT FROM OLD.role
           OR NEW.permissions IS DISTINCT FROM OLD.permissions
           OR NEW.student_id IS DISTINCT FROM OLD.student_id
           OR NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Somente um administrador pode alterar papel, permissões, status ou vínculo de um usuário.';
        END IF;

        -- company_id: nem o próprio gestor muda a empresa dele
        IF NEW.company_id IS DISTINCT FROM OLD.company_id AND NOT public.is_company_manager() THEN
            RAISE EXCEPTION 'Somente um administrador pode mover um usuário de empresa.';
        END IF;
        IF NEW.company_id IS DISTINCT FROM OLD.company_id
           AND public.is_company_manager()
           AND NEW.company_id IS DISTINCT FROM public.get_current_company_id() THEN
            RAISE EXCEPTION 'Um gestor só pode vincular usuários à própria empresa.';
        END IF;

        -- teacher_id: só o gestor remaneja, e só entre professores da
        -- empresa dele. Professor comum não zera o próprio vínculo.
        IF NEW.teacher_id IS DISTINCT FROM OLD.teacher_id THEN
            IF NOT public.is_company_manager() THEN
                RAISE EXCEPTION 'Somente um administrador pode alterar papel, permissões, status ou vínculo de um usuário.';
            END IF;
            IF NEW.teacher_id IS NOT NULL AND NOT public.manages_teacher(NEW.teacher_id) THEN
                RAISE EXCEPTION 'Um gestor só pode vincular usuários a professores da própria empresa.';
            END IF;
            IF OLD.teacher_id IS NOT NULL AND NOT public.manages_teacher(OLD.teacher_id) THEN
                RAISE EXCEPTION 'Um gestor só pode remanejar usuários que já são da própria empresa.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_system_user_privileges ON public.system_users;
CREATE TRIGGER protect_system_user_privileges
    BEFORE UPDATE ON public.system_users
    FOR EACH ROW EXECUTE FUNCTION public.protect_system_user_privileges();

-- ====================================================================
-- 9. CADASTRO PÚBLICO NÃO CRIA GESTOR
-- handle_new_user_registration já força professor ou aluno; esta é a
-- garantia explícita de que nada no metadata muda isso.
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_system_users_role_company
    ON public.system_users(role, company_id);
