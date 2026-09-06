-- ====================================================================
-- SUPABASE MIGRATION: 20260906030000_teacher_invite.sql
--
-- FASE 4: a academia se monta sozinha, sem SQL na mão.
--
-- Faltavam três coisas para o convite funcionar:
--
--   1. O gestor não conseguia criar professor. A política de teachers só
--      deixa admin, ou o próprio professor criando o tenant dele. Então o
--      gestor cadastrava o usuário e o perfil do professor não nascia.
--
--   2. O gatilho de cadastro ignorava o pré-cadastro. Ao se registrar, o
--      professor convidado ganhava um tenant NOVO ('user-<uuid>'), enquanto
--      a linha pré-cadastrada guardava outro teacher_id. Sobrava um perfil
--      órfão e o professor entrava no lugar errado.
--
--   3. Convite não tinha estado. A coluna status já aceita 'pendente', mas
--      nada usava: não dava para distinguir quem foi convidado e ainda não
--      entrou de quem já está trabalhando.
--
-- Idempotente.
-- ====================================================================

-- ====================================================================
-- 1. O GESTOR CRIA PROFESSOR NA PRÓPRIA EMPRESA
-- ====================================================================
DROP POLICY IF EXISTS teachers_manager_insert ON public.teachers;
CREATE POLICY teachers_manager_insert ON public.teachers
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_company_manager()
        AND company_id IS NOT NULL
        AND company_id = public.get_current_company_id()
    );

-- ====================================================================
-- 2. O GATILHO PASSA A RESPEITAR O CONVITE
--
-- Quem foi pré-cadastrado entra no tenant que já existe para ele, com a
-- empresa que já foi definida, e o convite vira conta ativa. Quem chega
-- sozinho pela vitrine continua ganhando o próprio tenant.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
    requested_role      TEXT;
    assigned_role       TEXT;
    effective_role      TEXT;
    assigned_name       TEXT;
    declared_teacher_id TEXT;
    assigned_student_id TEXT;
    assigned_avatar     TEXT;
    existing_role       TEXT;
    existing_teacher    TEXT;
    existing_company    TEXT;
    convidado           BOOLEAN := FALSE;
    final_teacher_id    TEXT;
BEGIN
    requested_role := NEW.raw_user_meta_data->>'role';
    assigned_role := CASE WHEN requested_role = 'aluno' THEN 'aluno' ELSE 'professor' END;
    assigned_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    declared_teacher_id := COALESCE(
        NEW.raw_user_meta_data->>'teacher_id',
        NEW.raw_user_meta_data->>'teacherId',
        NULL
    );
    assigned_student_id := COALESCE(
        NEW.raw_user_meta_data->>'student_id',
        NEW.raw_user_meta_data->>'studentId',
        NULL
    );
    assigned_avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    );

    -- O pré-cadastro (convite) manda no papel, no tenant e na empresa
    SELECT role, teacher_id, company_id
      INTO existing_role, existing_teacher, existing_company
      FROM public.system_users
     WHERE lower(email) = lower(NEW.email)
     LIMIT 1;

    convidado := existing_role IS NOT NULL;
    effective_role := COALESCE(existing_role, assigned_role);

    IF effective_role = 'professor' THEN
        -- Convidado entra no tenant que a academia já preparou para ele.
        -- Sem convite, o tenant é o próprio: aceitar teacher_id do metadata
        -- deixaria qualquer pessoa se declarar dona do tenant alheio.
        final_teacher_id := COALESCE(existing_teacher, 'user-' || NEW.id::text);
        PERFORM public.ensure_teacher_profile(final_teacher_id, assigned_name, NEW.email, assigned_avatar);
    ELSIF convidado THEN
        -- Assistente ou aluno convidado: mantém o vínculo do convite
        final_teacher_id := existing_teacher;
    ELSE
        -- Aluno chegando pela vitrine de um professor, se ele existir mesmo
        final_teacher_id := declared_teacher_id;
        IF final_teacher_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM public.teachers WHERE id = final_teacher_id) THEN
            final_teacher_id := NULL;
        END IF;
    END IF;

    INSERT INTO public.system_users (
        id, auth_user_id, name, email, role, avatar_url, phone,
        teacher_id, company_id, student_id, status, permissions, created_at, updated_at
    )
    VALUES (
        'user-' || NEW.id::text,
        NEW.id,
        assigned_name,
        lower(NEW.email),
        assigned_role,
        assigned_avatar,
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'whatsapp', NULL),
        final_teacher_id,
        existing_company,
        assigned_student_id,
        'ativo',
        CASE
            WHEN assigned_role = 'aluno'
                THEN ARRAY['view_own_classes', 'book_classes', 'view_own_invoices', 'access_multimedia']
            ELSE ARRAY['manage_own_agenda', 'manage_own_services', 'manage_own_students',
                       'manage_own_finances', 'manage_own_site']
        END,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        auth_user_id = EXCLUDED.auth_user_id,
        role         = COALESCE(existing_role, EXCLUDED.role),
        teacher_id   = COALESCE(existing_teacher, EXCLUDED.teacher_id),
        -- Aceitar o convite ativa a conta. Quem foi desativado de propósito
        -- continua desativado: cadastrar de novo não é jeito de voltar.
        status = CASE
            WHEN public.system_users.status = 'pendente' THEN 'ativo'
            ELSE public.system_users.status
        END,
        updated_at   = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- ====================================================================
-- 3. CONVITE PENDENTE NÃO É CONTA ATIVA
--
-- Quem foi convidado e ainda não entrou fica 'pendente'. A trava de
-- privilégios já impede não-admin de mexer em status, mas o gestor
-- precisa conseguir cancelar um convite que ainda não foi aceito.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.protect_system_user_privileges()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_admin() AND auth.uid() IS NOT NULL THEN
        IF NEW.role IS DISTINCT FROM OLD.role
           OR NEW.permissions IS DISTINCT FROM OLD.permissions
           OR NEW.student_id IS DISTINCT FROM OLD.student_id THEN
            RAISE EXCEPTION 'Somente um administrador pode alterar papel, permissões, status ou vínculo de um usuário.';
        END IF;

        -- status: o gestor só mexe em convite que ainda não foi aceito
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            IF NOT (public.is_company_manager()
                    AND OLD.status = 'pendente'
                    AND OLD.auth_user_id IS NULL
                    AND (OLD.company_id = public.get_current_company_id()
                         OR public.manages_teacher(OLD.teacher_id))) THEN
                RAISE EXCEPTION 'Somente um administrador pode alterar papel, permissões, status ou vínculo de um usuário.';
            END IF;
        END IF;

        IF NEW.company_id IS DISTINCT FROM OLD.company_id AND NOT public.is_company_manager() THEN
            RAISE EXCEPTION 'Somente um administrador pode mover um usuário de empresa.';
        END IF;
        IF NEW.company_id IS DISTINCT FROM OLD.company_id
           AND public.is_company_manager()
           AND NEW.company_id IS DISTINCT FROM public.get_current_company_id() THEN
            RAISE EXCEPTION 'Um gestor só pode vincular usuários à própria empresa.';
        END IF;

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

-- O gestor apaga convite não aceito; conta com login é assunto de admin
DROP POLICY IF EXISTS system_users_manager_delete ON public.system_users;
CREATE POLICY system_users_manager_delete ON public.system_users
    FOR DELETE TO authenticated
    USING (
        public.is_company_manager()
        AND auth_user_id IS NULL
        AND status = 'pendente'
        AND (company_id = public.get_current_company_id() OR public.manages_teacher(teacher_id))
    );

CREATE INDEX IF NOT EXISTS idx_system_users_pendentes
    ON public.system_users(company_id, status) WHERE auth_user_id IS NULL;
