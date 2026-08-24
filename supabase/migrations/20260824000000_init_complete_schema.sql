-- ==========================================================
-- SUPABASE MIGRATION: 20260824000000_init_complete_schema.sql
-- SCHEMA COMPLETO E ENDURECIDO: SISTEMA AGÊNDA DO PROFESSOR
-- ==========================================================

-- Extensões úteis do PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PROFESSORES / INSTRUTORES
CREATE TABLE IF NOT EXISTS public.teachers (
    id TEXT PRIMARY KEY,
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
    n8n_webhook_url TEXT,
    n8n_auth_token TEXT,
    whatsapp_auto_reminder_8h BOOLEAN DEFAULT true,
    vacation_mode JSONB DEFAULT '{"enabled": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE SERVIÇOS & MODALIDADES
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE ALUNOS (CRM)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE AGENDAMENTOS (APPOINTMENTS)
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
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
    reminder_8h_sent BOOLEAN DEFAULT false,
    google_calendar_event_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA DE COBRANÇAS E FATURAS (PAYMENTS)
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES public.students(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    student_phone TEXT,
    student_email TEXT,
    service_or_plan_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    due_date TEXT NOT NULL, -- Formato YYYY-MM-DD
    paid_at TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    method TEXT NOT NULL DEFAULT 'pix',
    pix_code TEXT,
    payment_link_url TEXT,
    installments TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA DE MULTIMÍDIA (VÍDEOS, AULAS GRAVADAS & PODCASTS)
CREATE TABLE IF NOT EXISTS public.videos (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'institucional', -- 'institucional' | 'videoaula' | 'podcast' | 'demonstrativo'
    category TEXT NOT NULL DEFAULT 'Geral',
    video_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    duration TEXT DEFAULT '05:00',
    description TEXT,
    featured BOOLEAN DEFAULT false,
    spotify_url TEXT,
    audio_url TEXT,
    episode_number TEXT,
    speaker_or_guest TEXT,
    publish_date TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABELA DE GALERIA DE FOTOS
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

-- 8. TABELA DE DEPOIMENTOS E AVALIAÇÕES
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

-- 9. TABELA DE FORMAÇÃO E CURRÍCULO
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

-- 10. TABELA DE PERGUNTAS FREQUENTES (FAQ)
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

-- 11. TABELA DE PLANOS & PACOTES
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

-- 12. TABELA DE LEMBRETES & TAREFAS
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

-- 13. TABELA DE MODELOS DE MENSAGENS (WHATSAPP)
CREATE TABLE IF NOT EXISTS public.message_templates (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- '8h_reminder' | 'immediate_confirm' | '1h_reminder' | 'cancellation'
    title TEXT NOT NULL,
    description TEXT,
    template TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. TABELA DE INTEGRAÇÕES (GOOGLE CALENDAR, WHATSAPP, WEBHOOKS)
CREATE TABLE IF NOT EXISTS public.integrations_config (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    google_calendar_sync BOOLEAN DEFAULT true,
    whatsapp_auto_reminder_8h BOOLEAN DEFAULT true,
    whatsapp_api_token TEXT,
    webhook_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- ÍNDICES DE ALTA PERFORMANCE (PERFORMANCE TUNING)
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_services_teacher ON public.services(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_teacher ON public.students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_appointments_teacher_date ON public.appointments(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_payments_teacher_status ON public.payments(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_videos_teacher_type ON public.videos(teacher_id, media_type);
CREATE INDEX IF NOT EXISTS idx_photos_teacher_cat ON public.photos(teacher_id, category);
CREATE INDEX IF NOT EXISTS idx_testimonials_teacher ON public.testimonials(teacher_id);
CREATE INDEX IF NOT EXISTS idx_reminders_teacher ON public.reminders(teacher_id, completed);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURANÇA E ACESSO
-- ==========================================================
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
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

-- Limpeza de políticas prévias
DO $$ 
DECLARE 
  tbl text;
BEGIN
  FOR tbl IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public read %I" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public insert %I" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated manage %I" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Anon manage %I" ON public.%I', tbl, tbl);
  END LOOP;
END $$;

-- 1. TABELAS PÚBLICAS PARA LEITURA (Landing page e Apresentação)
CREATE POLICY "Public read teachers" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Authenticated manage teachers" ON public.teachers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage teachers" ON public.teachers FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Authenticated manage services" ON public.services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage services" ON public.services FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public read videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Authenticated manage videos" ON public.videos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage videos" ON public.videos FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public read photos" ON public.photos FOR SELECT USING (true);
CREATE POLICY "Authenticated manage photos" ON public.photos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage photos" ON public.photos FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Authenticated manage testimonials" ON public.testimonials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage testimonials" ON public.testimonials FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public read curriculum_items" ON public.curriculum_items FOR SELECT USING (true);
CREATE POLICY "Authenticated manage curriculum_items" ON public.curriculum_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage curriculum_items" ON public.curriculum_items FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Authenticated manage faqs" ON public.faqs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage faqs" ON public.faqs FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public read pricing_plans" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "Authenticated manage pricing_plans" ON public.pricing_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage pricing_plans" ON public.pricing_plans FOR ALL TO anon USING (true) WITH CHECK (true);

-- 2. TABELAS DE FLUXO DE AGENDAMENTO (Público pode inserir, professor autenticado gerencia tudo)
CREATE POLICY "Public insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated manage students" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage students" ON public.students FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public insert appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated manage appointments" ON public.appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage appointments" ON public.appointments FOR ALL TO anon USING (true) WITH CHECK (true);

-- 3. TABELAS PRIVADAS DO PROFESSOR (Financeiro, Lembretes, Mensagens, Integrações)
CREATE POLICY "Authenticated manage payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage payments" ON public.payments FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated manage reminders" ON public.reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage reminders" ON public.reminders FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated manage message_templates" ON public.message_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage message_templates" ON public.message_templates FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated manage integrations_config" ON public.integrations_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage integrations_config" ON public.integrations_config FOR ALL TO anon USING (true) WITH CHECK (true);
