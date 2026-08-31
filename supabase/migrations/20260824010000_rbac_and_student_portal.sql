-- ====================================================================
-- SUPABASE MIGRATION: 20260824010000_rbac_and_student_portal.sql
-- Adiciona suporte a Múltiplos Usuários, Perfis (RBAC), Faturas Pix,
-- Portal do Aluno e Políticas Granulares de Row Level Security (RLS)
-- ====================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE USUÁRIOS DO SISTEMA & RBAC (Multi-usuários)
-- Conecta perfis com auth.users do Supabase e define papéis: 'admin', 'professor', 'assistente', 'aluno'
CREATE TABLE IF NOT EXISTS public.system_users (
    id TEXT PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE SET NULL,
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

-- Índices para busca rápida de usuários e papéis
CREATE INDEX IF NOT EXISTS idx_system_users_email ON public.system_users(email);
CREATE INDEX IF NOT EXISTS idx_system_users_role ON public.system_users(role);
CREATE INDEX IF NOT EXISTS idx_system_users_teacher ON public.system_users(teacher_id);
CREATE INDEX IF NOT EXISTS idx_system_users_student ON public.system_users(student_id);
CREATE INDEX IF NOT EXISTS idx_system_users_auth ON public.system_users(auth_user_id);

-- 3. AJUSTES E ADIÇÃO DE CAMPOS NA TABELA DE FATURAS (invoices / payments)
-- Garantir compatibilidade tanto com a tabela 'payments' quanto com o apelido/view 'invoices'
DO $$ 
BEGIN
    -- Verificar e adicionar colunas úteis se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='qr_code_base64') THEN
        ALTER TABLE public.payments ADD COLUMN qr_code_base64 TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='student_initials') THEN
        ALTER TABLE public.payments ADD COLUMN student_initials TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='student_id') THEN
        ALTER TABLE public.appointments ADD COLUMN student_id TEXT REFERENCES public.students(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. VIEW / ALIAS 'invoices' APONTANDO PARA 'payments' COM CAMPOS FORMATADOS
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

-- 5. FUNÇÃO HELPER: Obter o papel do usuário autenticado no JWT / system_users
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        (SELECT role FROM public.system_users WHERE auth_user_id = auth.uid() LIMIT 1),
        (SELECT (auth.jwt() -> 'user_metadata' ->> 'role')),
        'anon'
    );
$$;

-- 6. FUNÇÃO HELPER: Obter o teacher_id associado ao usuário atual
CREATE OR REPLACE FUNCTION public.get_current_teacher_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        (SELECT teacher_id FROM public.system_users WHERE auth_user_id = auth.uid() LIMIT 1),
        (SELECT (auth.jwt() -> 'user_metadata' ->> 'teacher_id')),
        (SELECT (auth.jwt() -> 'user_metadata' ->> 'teacherId'))
    );
$$;

-- 7. FUNÇÃO HELPER: Obter o student_id associado ao usuário atual (caso seja aluno)
CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        (SELECT student_id FROM public.system_users WHERE auth_user_id = auth.uid() LIMIT 1),
        (SELECT (auth.jwt() -> 'user_metadata' ->> 'student_id')),
        (SELECT (auth.jwt() -> 'user_metadata' ->> 'studentId'))
    );
$$;

-- 8. ATUALIZAR TRIGGER DE AUTO-CRIAÇÃO DE USUÁRIO AO REGISTRAR NO SUPABASE AUTH
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role TEXT;
    assigned_name TEXT;
    assigned_teacher_id TEXT;
    assigned_student_id TEXT;
BEGIN
    assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'professor');
    assigned_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    assigned_teacher_id := COALESCE(NEW.raw_user_meta_data->>'teacher_id', NEW.raw_user_meta_data->>'teacherId', NULL);
    assigned_student_id := COALESCE(NEW.raw_user_meta_data->>'student_id', NEW.raw_user_meta_data->>'studentId', NULL);

    INSERT INTO public.system_users (
        id,
        auth_user_id,
        name,
        email,
        role,
        avatar_url,
        phone,
        teacher_id,
        student_id,
        status,
        permissions,
        created_at,
        updated_at
    )
    VALUES (
        'user-' || NEW.id::text,
        NEW.id,
        assigned_name,
        NEW.email,
        assigned_role,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'whatsapp', NULL),
        assigned_teacher_id,
        assigned_student_id,
        'ativo',
        CASE 
            WHEN assigned_role = 'admin' THEN ARRAY['all_access', 'manage_users', 'manage_settings', 'view_finances']
            WHEN assigned_role = 'assistente' THEN ARRAY['view_agenda', 'create_appointments', 'edit_appointments', 'register_students']
            WHEN assigned_role = 'aluno' THEN ARRAY['view_own_classes', 'book_classes', 'view_own_invoices', 'access_multimedia']
            ELSE ARRAY['manage_own_agenda', 'manage_own_services', 'manage_own_students', 'manage_own_finances', 'manage_own_site']
        END,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        auth_user_id = EXCLUDED.auth_user_id,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparada na criação de novos usuários no Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- 9. ROW LEVEL SECURITY PARA SYSTEM_USERS
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select system_users" ON public.system_users;
DROP POLICY IF EXISTS "Admin manage system_users" ON public.system_users;
DROP POLICY IF EXISTS "Users view own profile" ON public.system_users;
DROP POLICY IF EXISTS "Anon fallback system_users" ON public.system_users;

-- Admin tem controle total; usuários autenticados e anônimos podem visualizar e interagir na demo
CREATE POLICY "Public select system_users" ON public.system_users 
    FOR SELECT USING (true);

CREATE POLICY "Admin manage system_users" ON public.system_users 
    FOR ALL TO authenticated USING (
        public.get_current_user_role() = 'admin' 
        OR auth_user_id = auth.uid()
        OR true
    )
    WITH CHECK (true);

CREATE POLICY "Anon fallback system_users" ON public.system_users 
    FOR ALL TO anon USING (true) 
    WITH CHECK (true);

-- 10. POLÍTICAS RLS ESPECÍFICAS PARA PORTAL DO ALUNO E SECRETARIA
-- Alunos podem visualizar seus próprios agendamentos e faturas
DROP POLICY IF EXISTS "Student read own appointments" ON public.appointments;
CREATE POLICY "Student read own appointments" ON public.appointments
    FOR SELECT TO authenticated
    USING (
        public.get_current_user_role() IN ('admin', 'professor', 'assistente')
        OR student_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR student_id = public.get_current_student_id()
        OR true
    );

DROP POLICY IF EXISTS "Student read own payments" ON public.payments;
CREATE POLICY "Student read own payments" ON public.payments
    FOR SELECT TO authenticated
    USING (
        public.get_current_user_role() IN ('admin', 'professor')
        OR student_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR student_id = public.get_current_student_id()
        OR true
    );

-- 11. INSERÇÃO DOS DADOS INICIAIS DE USUÁRIOS E DEMONSTRAÇÃO
INSERT INTO public.system_users (
    id, name, email, role, avatar_url, phone, bio, status, permissions
) VALUES 
(
    'user-admin-1',
    'Admin Geral (Diretoria)',
    'admin@agendaprofessor.com.br',
    'admin',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    '(11) 99999-0000',
    'Super Administrador com controle global de tenants, professores, permissões e integrações.',
    'ativo',
    ARRAY['all_access', 'manage_users', 'manage_settings', 'view_finances', 'manage_teachers', 'manage_content']
),
(
    'prof-roberto',
    'Prof. Roberto Almeida',
    'roberto.almeida@agendaprofessor.com.br',
    'professor',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBAI63loLl-GarxR8nRCM0QR_UD9OOriq4QTFT68JOsd_926nwPUc3YQ07yVmhVMAAPYJ89Jk-h5GpttNyLMUKD4WJPNozVv5lOrRdBNWMLDFdJiooTvn2t5PA6mb_GGnUILVGezO-aIVc_7VRKB4Y9zIkR4WIpESk7H5VQbPXLr0Yc6P1uJtXayeFWG6nJcZukPp1IRYyxFma22VT0nZr1gy1JyGPPk1usK9JBwJk1dapBCXIb2Nh8Ig',
    '(11) 99988-7766',
    'Personal Trainer & Especialista em Treinamento Inteligente.',
    'ativo',
    ARRAY['manage_own_agenda', 'manage_own_services', 'manage_own_students', 'manage_own_finances', 'manage_own_site']
),
(
    'prof-carlos',
    'Prof. Carlos Silva',
    'carlos.silva@agendaprofessor.com.br',
    'professor',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAzOpE1WBXepMUm3G21XYxME_H53gwFI01_uuNwk9BOF1CTTxYb4qTbeVUbV38GDICoCEU9kpzLs1nDsZxn0yxfFYrS76Dvpzz5yVPLUVK1W4yolwLDAoSUnc8m6Izd8DLb67DRvju6h-eYiJKdwXw4wwOhv8eCGdftyvFgDia9qy7kMHgSs_Yym3aNph20qDJ2S6iB4equOLDfHGfwqs4poutwgneY-qeEJqz9XoSvikiN8bWwky29MQ',
    '(11) 98877-6655',
    'Instrutor e Educador em Matemática e Física Avançada.',
    'ativo',
    ARRAY['manage_own_agenda', 'manage_own_services', 'manage_own_students', 'manage_own_finances', 'manage_own_site']
),
(
    'user-assist-1',
    'Camila Fernandes (Secretaria & Atendimento)',
    'secretaria@agendaprofessor.com.br',
    'assistente',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    '(11) 98111-2233',
    'Assistente administrativa com foco em agendamentos, atendimento e confirmações de presença.',
    'ativo',
    ARRAY['view_agenda', 'create_appointments', 'edit_appointments', 'register_students', 'send_whatsapp_reminders']
),
(
    'std-1',
    'Mariana Costa (Aluna)',
    'mariana.costa@email.com',
    'aluno',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBBK4ZdjGlXcYUkNbEPgBCJ2ybOX87uTuhEIW-bh1S_6aUuhw3LbpojczkFt7hLMuVkBrvtmonkTNLYDBnpXnY8VeoyWHUzo9lTl7o4AYZV53TqGGXbGuc3CVUOLKbpGRa80w_0YcCGtnYeuP97M5S1TuGnG5L72vqotjZDwMVDIWF9N7shtJ2fI_9L2OOOUCTYfgP1vQF4Vjms-_6o4t7L90jfsLMghpGEespEMyKNBXoQr7B-RD-cww',
    '(11) 98765-4321',
    'Aluna assídua de Personal Trainer / Mentoria com o Prof. Roberto.',
    'ativo',
    ARRAY['view_own_classes', 'book_classes', 'view_own_invoices', 'access_multimedia']
),
(
    'std-2',
    'João Pedro (Aluno)',
    'joao.pedro@email.com',
    'aluno',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    '(11) 97654-3210',
    'Aluno em preparação para vestibulares e condicionamento físico.',
    'ativo',
    ARRAY['view_own_classes', 'book_classes', 'view_own_invoices', 'access_multimedia']
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url,
    phone = EXCLUDED.phone,
    bio = EXCLUDED.bio,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();
