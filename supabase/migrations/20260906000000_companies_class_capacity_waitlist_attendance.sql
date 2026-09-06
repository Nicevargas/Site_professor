-- ====================================================================
-- SUPABASE MIGRATION: 20260906000000_companies_class_capacity_waitlist_attendance.sql
--
-- Quatro coisas que passaram a existir no produto:
--   1. companies      -> empresa/escola: o "perfil principal" que agrupa
--                        professores e os usuários que respondem a eles.
--   2. capacidade      -> services.capacity e appointments.capacity: quantos
--                        alunos cabem por horário. 1 = aula individual.
--   3. waitlist        -> fila de espera de quem tentou entrar numa turma lotada.
--   4. chamada         -> appointments.attendance: presença por aluno, e
--                        students.level: iniciante / intermediário / avançado.
--
-- Idempotente: pode rodar mais de uma vez.
-- ====================================================================

-- ====================================================================
-- 1. EMPRESAS / ESCOLAS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.companies (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    trade_name   TEXT,
    document     TEXT,
    email        TEXT,
    phone        TEXT,
    city         TEXT,
    logo_url     TEXT,
    notes        TEXT,
    status       TEXT NOT NULL DEFAULT 'ativa',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_status_check') THEN
        ALTER TABLE public.companies
            ADD CONSTRAINT companies_status_check CHECK (status IN ('ativa', 'inativa'));
    END IF;
END $$;

-- Vínculo do professor e do usuário com a empresa
ALTER TABLE public.teachers     ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.system_users ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_teachers_company     ON public.teachers(company_id);
CREATE INDEX IF NOT EXISTS idx_system_users_company ON public.system_users(company_id);

-- ====================================================================
-- 2. CAPACIDADE DA TURMA
-- Padrão 1 mantém o comportamento antigo: uma aula, um aluno.
-- ====================================================================
ALTER TABLE public.services     ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.services     ADD COLUMN IF NOT EXISTS levels   TEXT[];
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS capacity INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_capacity_check') THEN
        ALTER TABLE public.services
            ADD CONSTRAINT services_capacity_check CHECK (capacity >= 1);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_capacity_check') THEN
        ALTER TABLE public.appointments
            ADD CONSTRAINT appointments_capacity_check CHECK (capacity IS NULL OR capacity >= 1);
    END IF;
END $$;

-- ====================================================================
-- 3. NÍVEL DO ALUNO E LISTA DE CHAMADA
-- ====================================================================
ALTER TABLE public.students     ADD COLUMN IF NOT EXISTS level TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS attendance           TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS attendance_note      TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS attendance_marked_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_level_check') THEN
        ALTER TABLE public.students
            ADD CONSTRAINT students_level_check
            CHECK (level IS NULL OR level IN ('iniciante', 'intermediario', 'avancado'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_attendance_check') THEN
        ALTER TABLE public.appointments
            ADD CONSTRAINT appointments_attendance_check
            CHECK (attendance IS NULL OR attendance IN ('presente', 'falta', 'justificada'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_students_level ON public.students(level);
-- A chamada e a contagem de vagas sempre leem o slot inteiro: serviço + data + hora.
CREATE INDEX IF NOT EXISTS idx_appointments_slot
    ON public.appointments(teacher_id, date, service_id, start_time);

-- ====================================================================
-- 4. LISTA DE ESPERA
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.waitlist (
    id            TEXT PRIMARY KEY,
    teacher_id    TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    service_id    TEXT,
    service_name  TEXT NOT NULL DEFAULT '',
    date          TEXT NOT NULL, -- YYYY-MM-DD, igual a appointments.date
    start_time    TEXT NOT NULL,
    student_id    TEXT,
    student_name  TEXT NOT NULL,
    student_phone TEXT,
    student_email TEXT,
    status        TEXT NOT NULL DEFAULT 'aguardando',
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    called_at     TIMESTAMPTZ
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'waitlist_status_check') THEN
        ALTER TABLE public.waitlist
            ADD CONSTRAINT waitlist_status_check
            CHECK (status IN ('aguardando', 'convocado', 'matriculado', 'removido'));
    END IF;
END $$;

-- A fila é lida por horário e em ordem de chegada
CREATE INDEX IF NOT EXISTS idx_waitlist_slot
    ON public.waitlist(teacher_id, date, service_id, start_time, created_at);

-- ====================================================================
-- 5. RLS
-- Empresas: qualquer pessoa logada lê (o seletor de vínculo precisa da lista);
-- só admin cria, altera ou apaga.
-- Lista de espera: é do tenant, como alunos e agendamentos. O visitante do
-- agendamento público entra na fila pelo mesmo caminho anônimo já usado lá.
-- ====================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS companies_read       ON public.companies;
DROP POLICY IF EXISTS companies_admin_write ON public.companies;

CREATE POLICY companies_read ON public.companies
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY companies_admin_write ON public.companies
    FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS waitlist_tenant_all    ON public.waitlist;
DROP POLICY IF EXISTS waitlist_public_insert ON public.waitlist;

CREATE POLICY waitlist_tenant_all ON public.waitlist
    FOR ALL TO authenticated
    USING (public.is_tenant_staff(teacher_id))
    WITH CHECK (public.is_tenant_staff(teacher_id));

-- O agendamento público é anônimo: entrar na fila é permitido, ler a fila não.
CREATE POLICY waitlist_public_insert ON public.waitlist
    FOR INSERT TO anon
    WITH CHECK (status = 'aguardando');

-- ====================================================================
-- 6. TROCA DE EMPRESA SÓ POR ADMIN
-- O professor não se muda de empresa sozinho, do mesmo jeito que não troca
-- o próprio plano (ver 20260905000000).
-- ====================================================================
CREATE OR REPLACE FUNCTION public.protect_teacher_company()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.company_id IS DISTINCT FROM OLD.company_id
       AND auth.uid() IS NOT NULL
       AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Somente um administrador pode trocar a empresa do professor.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_teacher_company ON public.teachers;
CREATE TRIGGER protect_teacher_company
    BEFORE UPDATE ON public.teachers
    FOR EACH ROW EXECUTE FUNCTION public.protect_teacher_company();
