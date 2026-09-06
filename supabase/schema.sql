-- ==========================================================
-- SCHEMA SUPABASE COMPLETO & UNIFICADO (COM RBAC & MULTI-USUÁRIO)
-- SISTEMA: AGENDA DO PROFESSOR (COMPLETO)
-- Execute este script no SQL Editor do seu Dashboard Supabase
-- ==========================================================

-- Extensões úteis do PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. TABELA DE EMPRESAS / ESCOLAS (perfil principal que agrupa professores)
CREATE TABLE IF NOT EXISTS public.companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    trade_name TEXT,
    document TEXT,
    email TEXT,
    phone TEXT,
    city TEXT,
    logo_url TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1. TABELA DE PROFESSORES / INSTRUTORES (Tenants)
CREATE TABLE IF NOT EXISTS public.teachers (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES public.companies(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    specialty TEXT,
    bio TEXT,
    whatsapp TEXT,
    email TEXT,
    avatar_url TEXT,
    hero_image_url TEXT,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    total_students INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 128,
    years_experience INTEGER DEFAULT 8,
    brand_name TEXT,
    logo_url TEXT,
    show_logo BOOLEAN DEFAULT true,
    primary_color TEXT DEFAULT '#00687a',
    secondary_color TEXT DEFAULT '#57dffe',
    accent_color TEXT DEFAULT '#004e5c',
    theme_preset TEXT DEFAULT 'ocean-teal',
    pix_key TEXT,
    pix_key_type TEXT DEFAULT 'email',
    pix_receiver_name TEXT,
    pix_bank_name TEXT,
    default_payment_gateway TEXT DEFAULT 'pix',
    whatsapp_auto_reminder_8h BOOLEAN DEFAULT true,
    vacation_mode JSONB DEFAULT '{"enabled": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE ALUNOS (CRM)
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar TEXT,
    joined_date TEXT,
    total_classes INTEGER DEFAULT 0,
    last_class TEXT,
    status TEXT DEFAULT 'Ativo',
    notes TEXT,
    level TEXT CHECK (level IS NULL OR level IN ('iniciante', 'intermediario', 'avancado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE USUÁRIOS DO SISTEMA & RBAC (Multi-usuários)
CREATE TABLE IF NOT EXISTS public.system_users (
    id TEXT PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE SET NULL,
    company_id TEXT REFERENCES public.companies(id) ON DELETE SET NULL,
    student_id TEXT REFERENCES public.students(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'professor' CHECK (role IN ('admin', 'professor', 'assistente', 'aluno')),
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pendente')),
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    last_login TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE SERVIÇOS & MODALIDADES
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 150.00,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    modality TEXT NOT NULL DEFAULT 'Online / Presencial',
    badge TEXT,
    icon_name TEXT DEFAULT 'school',
    active BOOLEAN DEFAULT true,
    capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity >= 1), -- 1 = aula individual
    levels TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA DE AGENDAMENTOS (APPOINTMENTS)
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES public.students(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    student_initials TEXT,
    student_avatar TEXT,
    student_phone TEXT,
    student_email TEXT,
    service_id TEXT,
    service_name TEXT NOT NULL,
    date TEXT NOT NULL, -- Formato YYYY-MM-DD
    day_of_week INTEGER NOT NULL DEFAULT 1,
    start_time TEXT NOT NULL, -- Formato HH:MM
    end_time TEXT NOT NULL,   -- Formato HH:MM
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    modality TEXT NOT NULL DEFAULT 'Online (Google Meet)',
    meeting_url TEXT,
    status TEXT NOT NULL DEFAULT 'Confirmado',
    notes TEXT,
    client_since TEXT,
    price NUMERIC(10, 2) DEFAULT 150.00,
    capacity INTEGER CHECK (capacity IS NULL OR capacity >= 1), -- limite só deste horário
    attendance TEXT CHECK (attendance IS NULL OR attendance IN ('presente', 'falta', 'justificada')),
    attendance_note TEXT,
    attendance_marked_at TIMESTAMP WITH TIME ZONE,
    reminder_8h_sent BOOLEAN DEFAULT false,
    google_calendar_event_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA DE COBRANÇAS E FATURAS (PAYMENTS)
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES public.students(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    student_phone TEXT,
    student_email TEXT,
    student_initials TEXT,
    service_or_plan_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    due_date TEXT NOT NULL, -- Formato YYYY-MM-DD
    paid_at TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    method TEXT NOT NULL DEFAULT 'pix',
    pix_code TEXT,
    qr_code_base64 TEXT,
    payment_link_url TEXT,
    installments TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABELA DE MULTIMÍDIA (VÍDEOS, AULAS GRAVADAS & PODCASTS)
CREATE TABLE IF NOT EXISTS public.videos (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'institucional', -- 'podcast' | 'curso_online' | 'institucional' | 'vendas'
    category TEXT NOT NULL DEFAULT 'Geral',
    video_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    duration TEXT DEFAULT '05:00',
    description TEXT,
    featured BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true, -- false = oculto no site e no portal do aluno
    spotify_url TEXT,
    audio_url TEXT,
    episode_number TEXT,
    speaker_or_guest TEXT,
    publish_date TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABELA DE GALERIA DE FOTOS
CREATE TABLE IF NOT EXISTS public.photos (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'aulas', -- 'aulas' | 'espaco' | 'conquistas' | 'bastidores'
    image_url TEXT NOT NULL,
    caption TEXT,
    date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABELA DE DEPOIMENTOS E AVALIAÇÕES
CREATE TABLE IF NOT EXISTS public.testimonials (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    role_or_course TEXT,
    avatar_url TEXT,
    rating NUMERIC(2, 1) DEFAULT 5.0,
    content TEXT NOT NULL,
    date TEXT,
    verified BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. TABELA DE FORMAÇÃO E CURRÍCULO
CREATE TABLE IF NOT EXISTS public.curriculum_items (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    institution TEXT NOT NULL,
    period TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'education', -- 'education' | 'experience' | 'certification' | 'award'
    description TEXT,
    skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. TABELA DE PERGUNTAS FREQUENTES (FAQ)
CREATE TABLE IF NOT EXISTS public.faqs (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'geral',
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. TABELA DE PLANOS & PACOTES
CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_month NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    is_popular BOOLEAN DEFAULT false,
    features_header TEXT,
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    cta_text TEXT DEFAULT 'Escolher Plano',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. TABELA DE LEMBRETES & TAREFAS
CREATE TABLE IF NOT EXISTS public.reminders (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_date TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    delayed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. TABELA DE MODELOS DE MENSAGENS (WHATSAPP)
CREATE TABLE IF NOT EXISTS public.message_templates (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    template TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. TABELA DE INTEGRAÇÕES (GOOGLE CALENDAR, WHATSAPP, WEBHOOKS)
CREATE TABLE IF NOT EXISTS public.integrations_config (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    google_calendar_sync BOOLEAN DEFAULT true,
    whatsapp_auto_reminder_8h BOOLEAN DEFAULT true,
    whatsapp_api_token TEXT,
    webhook_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. TABELA DE LISTA DE ESPERA (turmas lotadas)
CREATE TABLE IF NOT EXISTS public.waitlist (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    service_id TEXT,
    service_name TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL, -- YYYY-MM-DD
    start_time TEXT NOT NULL, -- HH:MM
    student_id TEXT,
    student_name TEXT NOT NULL,
    student_phone TEXT,
    student_email TEXT,
    status TEXT NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'convocado', 'matriculado', 'removido')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    called_at TIMESTAMP WITH TIME ZONE
);

-- 16. VIEW 'invoices' COMPATÍVEL
CREATE OR REPLACE VIEW public.invoices AS
SELECT 
    id,
    teacher_id AS "teacherId",
    student_id AS "studentId",
    student_name AS "studentName",
    student_phone AS "studentPhone",
    student_email AS "studentEmail",
    service_or_plan_name AS "serviceOrPlanName",
    amount,
    due_date AS "dueDate",
    paid_at AS "paidAt",
    status,
    method,
    pix_code AS "pixCode",
    payment_link_url AS "paymentLinkUrl",
    installments,
    notes,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
FROM public.payments;

-- ==========================================================
-- ÍNDICES DE PERFORMANCE
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_services_teacher ON public.services(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_teacher ON public.students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_system_users_email ON public.system_users(email);
CREATE INDEX IF NOT EXISTS idx_system_users_role ON public.system_users(role);
CREATE INDEX IF NOT EXISTS idx_appointments_teacher_date ON public.appointments(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_payments_teacher_status ON public.payments(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_videos_teacher_type ON public.videos(teacher_id, media_type);
CREATE INDEX IF NOT EXISTS idx_photos_teacher_cat ON public.photos(teacher_id, category);
CREATE INDEX IF NOT EXISTS idx_testimonials_teacher ON public.testimonials(teacher_id);
CREATE INDEX IF NOT EXISTS idx_reminders_teacher ON public.reminders(teacher_id, completed);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================================
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
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

-- Políticas de governança (mesmo conteúdo de migrations/20260903000000_tenant_rls_governance.sql)
-- Isolamento por professor (tenant) e por papel: admin / professor / assistente / aluno / anônimo

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
