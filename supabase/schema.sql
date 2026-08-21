-- ==========================================================
-- SCHEMA SUPABASE: AGENDA DO PROFESSOR & INTEGRAÇÕES
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

-- ATIVAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_config ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PÚBLICAS DE ACESSO PARA DEMONSTRAÇÃO E APP
CREATE POLICY "Permitir leitura pública de professores" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Permitir escrita pública de professores" ON public.teachers FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública de serviços" ON public.services FOR SELECT USING (true);
CREATE POLICY "Permitir escrita pública de serviços" ON public.services FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública de alunos" ON public.students FOR SELECT USING (true);
CREATE POLICY "Permitir escrita pública de alunos" ON public.students FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública de agendamentos" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Permitir escrita pública de agendamentos" ON public.appointments FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública de lembretes" ON public.reminders FOR SELECT USING (true);
CREATE POLICY "Permitir escrita pública de lembretes" ON public.reminders FOR ALL USING (true);

CREATE POLICY "Permitir leitura pública de integrações" ON public.integrations_config FOR SELECT USING (true);
CREATE POLICY "Permitir escrita pública de integrações" ON public.integrations_config FOR ALL USING (true);
