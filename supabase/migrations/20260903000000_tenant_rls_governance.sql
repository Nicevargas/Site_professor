-- ====================================================================
-- SUPABASE MIGRATION: 20260903000000_tenant_rls_governance.sql
-- Governança real de acesso: substitui as políticas permissivas
-- (USING (true) / OR true) por isolamento por professor (tenant) e por papel.
--
-- Papéis (system_users.role):
--   admin      -> plataforma inteira
--   professor  -> apenas o próprio tenant (teacher_id)
--   assistente -> agenda, alunos e serviços do tenant; sem financeiro/configurações
--   aluno      -> apenas os próprios agendamentos, faturas e dados
--   anônimo    -> leitura do site público + criação de agendamento pelo site
-- ====================================================================

-- 1. SEGREDOS DE INTEGRAÇÃO SAEM DA TABELA PÚBLICA teachers
--    (teachers é lida pelo site aberto; token do n8n não pode ficar lá)
INSERT INTO public.integrations_config (id, teacher_id, webhook_url, whatsapp_api_token, whatsapp_auto_reminder_8h, updated_at)
SELECT 'integ-' || t.id, t.id, t.n8n_webhook_url, t.n8n_auth_token, COALESCE(t.whatsapp_auto_reminder_8h, true), NOW()
FROM public.teachers t
WHERE (t.n8n_webhook_url IS NOT NULL OR t.n8n_auth_token IS NOT NULL)
ON CONFLICT (id) DO UPDATE SET
    webhook_url = COALESCE(EXCLUDED.webhook_url, public.integrations_config.webhook_url),
    whatsapp_api_token = COALESCE(EXCLUDED.whatsapp_api_token, public.integrations_config.whatsapp_api_token),
    updated_at = NOW();

ALTER TABLE public.teachers DROP COLUMN IF EXISTS n8n_webhook_url;
ALTER TABLE public.teachers DROP COLUMN IF EXISTS n8n_auth_token;

-- 2. PROFESSORES SEMEADOS SEM teacher_id: o próprio id é o tenant
UPDATE public.system_users su
SET teacher_id = su.id, updated_at = NOW()
WHERE su.role = 'professor'
  AND su.teacher_id IS NULL
  AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = su.id);

-- 3. FUNÇÕES HELPER (fonte da verdade = system_users; nunca o metadata do JWT,
--    porque o metadata é definido pelo próprio usuário no cadastro)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        (SELECT role FROM public.system_users WHERE auth_user_id = auth.uid() AND status = 'ativo' LIMIT 1),
        'anon'
    );
$$;

CREATE OR REPLACE FUNCTION public.get_current_teacher_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        su.teacher_id,
        CASE WHEN su.role = 'professor' THEN su.id END
    )
    FROM public.system_users su
    WHERE su.auth_user_id = auth.uid() AND su.status = 'ativo'
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT student_id FROM public.system_users
    WHERE auth_user_id = auth.uid() AND status = 'ativo'
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT lower(COALESCE(auth.jwt() ->> 'email', ''));
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT public.get_current_user_role() = 'admin';
$$;

-- Admin, ou professor/assistente do tenant informado
CREATE OR REPLACE FUNCTION public.is_tenant_staff(target_teacher TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT public.is_admin()
        OR (
            public.get_current_user_role() IN ('professor', 'assistente')
            AND target_teacher IS NOT NULL
            AND target_teacher = public.get_current_teacher_id()
        );
$$;

-- Admin, ou o professor dono do tenant (financeiro, site, integrações, configurações)
CREATE OR REPLACE FUNCTION public.is_tenant_owner(target_teacher TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT public.is_admin()
        OR (
            public.get_current_user_role() = 'professor'
            AND target_teacher IS NOT NULL
            AND target_teacher = public.get_current_teacher_id()
        );
$$;

-- Aluno autenticado dono do registro (por student_id ou pelo e-mail do login)
CREATE OR REPLACE FUNCTION public.is_own_student_record(target_student TEXT, target_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT (target_student IS NOT NULL AND target_student = public.get_current_student_id())
        OR (target_email IS NOT NULL AND lower(target_email) = public.current_user_email() AND public.current_user_email() <> '');
$$;

-- 4. CADASTRO VIA AUTH: papel autodeclarado só pode ser professor ou aluno.
--    admin e assistente são atribuídos por um admin na tela de Usuários.
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
    requested_role TEXT;
    assigned_role TEXT;
    assigned_name TEXT;
    assigned_teacher_id TEXT;
    assigned_student_id TEXT;
    existing_role TEXT;
BEGIN
    requested_role := NEW.raw_user_meta_data->>'role';
    assigned_role := CASE WHEN requested_role = 'aluno' THEN 'aluno' ELSE 'professor' END;
    assigned_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    assigned_teacher_id := COALESCE(NEW.raw_user_meta_data->>'teacher_id', NEW.raw_user_meta_data->>'teacherId', NULL);
    assigned_student_id := COALESCE(NEW.raw_user_meta_data->>'student_id', NEW.raw_user_meta_data->>'studentId', NULL);

    -- Se um admin já pré-cadastrou este e-mail com outro papel, o papel pré-cadastrado prevalece
    SELECT role INTO existing_role FROM public.system_users WHERE lower(email) = lower(NEW.email) LIMIT 1;

    INSERT INTO public.system_users (
        id, auth_user_id, name, email, role, avatar_url, phone,
        teacher_id, student_id, status, permissions, created_at, updated_at
    )
    VALUES (
        'user-' || NEW.id::text,
        NEW.id,
        assigned_name,
        lower(NEW.email),
        assigned_role,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'whatsapp', NULL),
        -- Professor novo é dono do próprio tenant
        CASE WHEN assigned_role = 'professor' THEN COALESCE(assigned_teacher_id, 'user-' || NEW.id::text) ELSE assigned_teacher_id END,
        assigned_student_id,
        'ativo',
        CASE
            WHEN assigned_role = 'aluno' THEN ARRAY['view_own_classes', 'book_classes', 'view_own_invoices', 'access_multimedia']
            ELSE ARRAY['manage_own_agenda', 'manage_own_services', 'manage_own_students', 'manage_own_finances', 'manage_own_site']
        END,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        auth_user_id = EXCLUDED.auth_user_id,
        role = COALESCE(existing_role, EXCLUDED.role),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- 5. NINGUÉM ALÉM DE ADMIN ALTERA PAPEL, PERMISSÕES OU VÍNCULO DE TENANT
CREATE OR REPLACE FUNCTION public.protect_system_user_privileges()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_admin() AND auth.uid() IS NOT NULL THEN
        IF NEW.role IS DISTINCT FROM OLD.role
           OR NEW.permissions IS DISTINCT FROM OLD.permissions
           OR NEW.teacher_id IS DISTINCT FROM OLD.teacher_id
           OR NEW.student_id IS DISTINCT FROM OLD.student_id
           OR NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Somente um administrador pode alterar papel, permissões, status ou vínculo de um usuário.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_system_user_privileges ON public.system_users;
CREATE TRIGGER protect_system_user_privileges
    BEFORE UPDATE ON public.system_users
    FOR EACH ROW EXECUTE FUNCTION public.protect_system_user_privileges();

-- 6. REMOVE TODAS AS POLÍTICAS ANTERIORES DAS TABELAS DO SISTEMA
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'teachers', 'services', 'students', 'system_users', 'appointments', 'payments',
              'videos', 'photos', 'testimonials', 'curriculum_items', 'faqs', 'pricing_plans',
              'reminders', 'message_templates', 'integrations_config'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 7. RLS ATIVO EM TODAS AS TABELAS
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_config ENABLE ROW LEVEL SECURITY;

-- 8. PERFIL DO PROFESSOR (público para leitura; só o dono edita)
CREATE POLICY "teachers_public_read" ON public.teachers
    FOR SELECT USING (true);
CREATE POLICY "teachers_owner_insert" ON public.teachers
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin() OR (public.get_current_user_role() = 'professor' AND id = public.get_current_teacher_id()));
CREATE POLICY "teachers_owner_update" ON public.teachers
    FOR UPDATE TO authenticated
    USING (public.is_tenant_owner(id)) WITH CHECK (public.is_tenant_owner(id));
CREATE POLICY "teachers_admin_delete" ON public.teachers
    FOR DELETE TO authenticated USING (public.is_admin());

-- 9. CONTEÚDO DO SITE PÚBLICO (leitura aberta; escrita do dono do tenant)
CREATE POLICY "services_public_read" ON public.services FOR SELECT USING (true);
CREATE POLICY "services_owner_write" ON public.services
    FOR ALL TO authenticated USING (public.is_tenant_owner(teacher_id)) WITH CHECK (public.is_tenant_owner(teacher_id));

CREATE POLICY "videos_public_read" ON public.videos FOR SELECT USING (true);
CREATE POLICY "videos_owner_write" ON public.videos
    FOR ALL TO authenticated USING (public.is_tenant_owner(teacher_id)) WITH CHECK (public.is_tenant_owner(teacher_id));

CREATE POLICY "photos_public_read" ON public.photos FOR SELECT USING (true);
CREATE POLICY "photos_owner_write" ON public.photos
    FOR ALL TO authenticated USING (public.is_tenant_owner(teacher_id)) WITH CHECK (public.is_tenant_owner(teacher_id));

CREATE POLICY "testimonials_public_read" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "testimonials_owner_write" ON public.testimonials
    FOR ALL TO authenticated USING (public.is_tenant_owner(teacher_id)) WITH CHECK (public.is_tenant_owner(teacher_id));

CREATE POLICY "curriculum_public_read" ON public.curriculum_items FOR SELECT USING (true);
CREATE POLICY "curriculum_owner_write" ON public.curriculum_items
    FOR ALL TO authenticated USING (public.is_tenant_owner(teacher_id)) WITH CHECK (public.is_tenant_owner(teacher_id));

CREATE POLICY "faqs_public_read" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "faqs_owner_write" ON public.faqs
    FOR ALL TO authenticated USING (public.is_tenant_owner(teacher_id)) WITH CHECK (public.is_tenant_owner(teacher_id));

CREATE POLICY "pricing_plans_public_read" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "pricing_plans_owner_write" ON public.pricing_plans
    FOR ALL TO authenticated USING (public.is_tenant_owner(teacher_id)) WITH CHECK (public.is_tenant_owner(teacher_id));

-- 10. ALUNOS (CRM): equipe do tenant, ou o próprio aluno lê seu registro
CREATE POLICY "students_staff_or_self_read" ON public.students
    FOR SELECT TO authenticated
    USING (public.is_tenant_staff(teacher_id) OR public.is_own_student_record(id, email));
-- O site público cria o cadastro do aluno ao agendar; exige tenant definido
CREATE POLICY "students_public_booking_insert" ON public.students
    FOR INSERT WITH CHECK (teacher_id IS NOT NULL);
CREATE POLICY "students_staff_update" ON public.students
    FOR UPDATE TO authenticated
    USING (public.is_tenant_staff(teacher_id)) WITH CHECK (public.is_tenant_staff(teacher_id));
CREATE POLICY "students_owner_delete" ON public.students
    FOR DELETE TO authenticated USING (public.is_tenant_owner(teacher_id));

-- 11. AGENDAMENTOS: equipe do tenant, ou o próprio aluno
CREATE POLICY "appointments_staff_or_self_read" ON public.appointments
    FOR SELECT TO authenticated
    USING (public.is_tenant_staff(teacher_id) OR public.is_own_student_record(student_id, student_email));
-- Agendamento pelo site aberto (visitante) e pelo portal do aluno
CREATE POLICY "appointments_public_booking_insert" ON public.appointments
    FOR INSERT WITH CHECK (teacher_id IS NOT NULL);
CREATE POLICY "appointments_staff_update" ON public.appointments
    FOR UPDATE TO authenticated
    USING (public.is_tenant_staff(teacher_id)) WITH CHECK (public.is_tenant_staff(teacher_id));
CREATE POLICY "appointments_staff_delete" ON public.appointments
    FOR DELETE TO authenticated USING (public.is_tenant_staff(teacher_id));

-- 12. FINANCEIRO: dono do tenant, ou o próprio aluno lê suas faturas
CREATE POLICY "payments_owner_or_self_read" ON public.payments
    FOR SELECT TO authenticated
    USING (public.is_tenant_owner(teacher_id) OR public.is_own_student_record(student_id, student_email));
CREATE POLICY "payments_owner_insert" ON public.payments
    FOR INSERT TO authenticated WITH CHECK (public.is_tenant_owner(teacher_id));
CREATE POLICY "payments_owner_update" ON public.payments
    FOR UPDATE TO authenticated
    USING (public.is_tenant_owner(teacher_id)) WITH CHECK (public.is_tenant_owner(teacher_id));
CREATE POLICY "payments_owner_delete" ON public.payments
    FOR DELETE TO authenticated USING (public.is_tenant_owner(teacher_id));

-- 13. LEMBRETES, MODELOS DE MENSAGEM E INTEGRAÇÕES: só o dono do tenant
CREATE POLICY "reminders_owner_all" ON public.reminders
    FOR ALL TO authenticated USING (public.is_tenant_owner(teacher_id)) WITH CHECK (public.is_tenant_owner(teacher_id));
CREATE POLICY "message_templates_owner_all" ON public.message_templates
    FOR ALL TO authenticated USING (public.is_tenant_owner(teacher_id)) WITH CHECK (public.is_tenant_owner(teacher_id));
CREATE POLICY "integrations_owner_all" ON public.integrations_config
    FOR ALL TO authenticated USING (public.is_tenant_owner(teacher_id)) WITH CHECK (public.is_tenant_owner(teacher_id));

-- 14. USUÁRIOS DO SISTEMA: admin gerencia; dono do tenant vê sua equipe e alunos; cada um vê e edita o próprio
CREATE POLICY "system_users_read" ON public.system_users
    FOR SELECT TO authenticated
    USING (public.is_admin() OR auth_user_id = auth.uid() OR public.is_tenant_owner(teacher_id));
CREATE POLICY "system_users_admin_or_owner_insert" ON public.system_users
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin()
        OR (role IN ('assistente', 'aluno') AND public.is_tenant_owner(teacher_id))
    );
CREATE POLICY "system_users_update" ON public.system_users
    FOR UPDATE TO authenticated
    USING (public.is_admin() OR auth_user_id = auth.uid() OR public.is_tenant_owner(teacher_id))
    WITH CHECK (public.is_admin() OR auth_user_id = auth.uid() OR public.is_tenant_owner(teacher_id));
CREATE POLICY "system_users_admin_delete" ON public.system_users
    FOR DELETE TO authenticated USING (public.is_admin());
