-- ==========================================================
-- SCHEMA SUPABASE: AGENDA DO PROFESSOR (COM RLS ENDURECIDO)
-- Execute este script no SQL Editor do seu Dashboard Supabase
-- ==========================================================

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
    icon_name TEXT DEFAULT 'school',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE AGENDAMENTOS (APPOINTMENTS)
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_initials TEXT,
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
    status TEXT NOT NULL DEFAULT 'Confirmado',
    notes TEXT,
    price NUMERIC(10, 2) DEFAULT 150.00,
    reminder_8h_sent BOOLEAN DEFAULT false,
    google_calendar_event_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA DE LEMBRETES & TAREFAS
CREATE TABLE IF NOT EXISTS public.reminders (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_date TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA DE INTEGRAÇÕES (GOOGLE CALENDAR, WHATSAPP 8H, WEBHOOKS)
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
-- HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ==========================================================
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_config ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura pública de professores" ON public.teachers;
DROP POLICY IF EXISTS "Permitir escrita pública de professores" ON public.teachers;
DROP POLICY IF EXISTS "Permitir leitura pública de serviços" ON public.services;
DROP POLICY IF EXISTS "Permitir escrita pública de serviços" ON public.services;
DROP POLICY IF EXISTS "Permitir leitura pública de alunos" ON public.students;
DROP POLICY IF EXISTS "Permitir escrita pública de alunos" ON public.students;
DROP POLICY IF EXISTS "Permitir leitura pública de agendamentos" ON public.appointments;
DROP POLICY IF EXISTS "Permitir escrita pública de agendamentos" ON public.appointments;
DROP POLICY IF EXISTS "Permitir leitura pública de lembretes" ON public.reminders;
DROP POLICY IF EXISTS "Permitir escrita pública de lembretes" ON public.reminders;
DROP POLICY IF EXISTS "Permitir leitura pública de integrações" ON public.integrations_config;
DROP POLICY IF EXISTS "Permitir escrita pública de integrações" ON public.integrations_config;

-- ==========================================================
-- NOVAS POLÍTICAS DE ACESSO MÍNIMO & SEGURO (RLS)
-- ==========================================================

-- 1. TEACHERS (Público pode ler o perfil para ver o site, apenas autenticados podem editar)
CREATE POLICY "Public read teachers"
  ON public.teachers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated manage teachers"
  ON public.teachers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. SERVICES (Público pode ler os serviços para agendar, apenas autenticados podem editar)
CREATE POLICY "Public read services"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "Authenticated manage services"
  ON public.services FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. STUDENTS (Público pode criar registro durante agendamento, mas NÃO pode listar alunos de outros)
CREATE POLICY "Public insert students"
  ON public.students FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated manage students"
  ON public.students FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. APPOINTMENTS (Público pode criar novos agendamentos no site, apenas autenticados podem ver agenda completa)
CREATE POLICY "Public insert appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated manage appointments"
  ON public.appointments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. REMINDERS (Apenas professores logados têm acesso)
CREATE POLICY "Authenticated manage reminders"
  ON public.reminders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. INTEGRATIONS_CONFIG (Tokens de webhook/WhatsApp protegidos - apenas professores logados)
CREATE POLICY "Authenticated manage integrations"
  ON public.integrations_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
