-- ====================================================================
-- SUPABASE MIGRATION: 20260906010000_teacher_profile_on_signup.sql
--
-- Professor recém-cadastrado nascia sem tenant.
--
-- O gatilho on_auth_user_created definia system_users.teacher_id como
-- 'user-<uuid>', mas nunca criava a linha correspondente em teachers.
-- Como system_users.teacher_id é chave estrangeira para teachers, o
-- próprio INSERT do gatilho violava a FK e o cadastro falhava. Quando não
-- falhava, o professor ficava sem tenant e quebrava ao cadastrar o
-- primeiro aluno ou serviço, que também referenciam teachers.
--
-- Junto vai uma brecha de privilégio: o teacher_id vinha de
-- raw_user_meta_data, que é escrito pelo próprio usuário no cadastro.
-- Bastava se cadastrar informando o teacher_id de outra pessoa para virar
-- dono do tenant dela -- is_tenant_owner() compara exatamente esse campo.
-- Agora quem se cadastra como professor SEMPRE recebe o próprio tenant, e
-- o vínculo declarado só é aceito para aluno, e mesmo assim só se o
-- professor existir de verdade.
--
-- Idempotente.
-- ====================================================================

-- ====================================================================
-- 1. GARANTIR O PERFIL DE PROFESSOR
-- O slug precisa ser único e casar com ^[a-z0-9][a-z0-9-]{1,47}$, senão o
-- gatilho enforce_teacher_addressing rejeita a linha.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.ensure_teacher_profile(
    p_id     TEXT,
    p_name   TEXT,
    p_email  TEXT DEFAULT NULL,
    p_avatar TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    base      TEXT;
    candidato TEXT;
    n         INTEGER := 1;
BEGIN
    IF p_id IS NULL OR btrim(p_id) = '' THEN
        RETURN NULL;
    END IF;

    -- Já existe: não encosta no que o professor configurou
    IF EXISTS (SELECT 1 FROM public.teachers WHERE id = p_id) THEN
        RETURN p_id;
    END IF;

    base := NULLIF(public.build_teacher_slug(p_name), '');
    -- Nome que vira slug vazio (só símbolos) ou curto demais para a regra
    IF base IS NULL OR length(base) < 2 THEN
        base := 'professor';
    END IF;
    base := left(base, 40);

    candidato := base;
    WHILE EXISTS (SELECT 1 FROM public.teachers WHERE slug = candidato) LOOP
        n := n + 1;
        candidato := base || '-' || n;
    END LOOP;

    INSERT INTO public.teachers (id, name, role, specialty, bio, email, avatar_url, slug)
    VALUES (
        p_id,
        COALESCE(NULLIF(btrim(p_name), ''), 'Professor'),
        'Professor',
        '',
        '',
        lower(NULLIF(btrim(COALESCE(p_email, '')), '')),
        COALESCE(p_avatar, ''),
        candidato
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN p_id;
END;
$$;

-- ====================================================================
-- 2. O GATILHO DE CADASTRO
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

    -- Se um admin já pré-cadastrou este e-mail com outro papel, o pré-cadastro prevalece
    SELECT role INTO existing_role FROM public.system_users WHERE lower(email) = lower(NEW.email) LIMIT 1;
    effective_role := COALESCE(existing_role, assigned_role);

    IF effective_role = 'professor' THEN
        -- O tenant de quem se cadastra como professor é SEMPRE o próprio.
        -- Aceitar o teacher_id vindo do metadata deixaria qualquer pessoa se
        -- declarar dona do tenant alheio.
        final_teacher_id := 'user-' || NEW.id::text;
        PERFORM public.ensure_teacher_profile(final_teacher_id, assigned_name, NEW.email, assigned_avatar);
    ELSE
        -- Aluno pode chegar pela vitrine de um professor, mas só vale se o
        -- professor existir. Vínculo inventado vira NULL em vez de quebrar a FK.
        final_teacher_id := declared_teacher_id;
        IF final_teacher_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM public.teachers WHERE id = final_teacher_id) THEN
            final_teacher_id := NULL;
        END IF;
    END IF;

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
        assigned_avatar,
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'whatsapp', NULL),
        final_teacher_id,
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
        role = COALESCE(existing_role, EXCLUDED.role),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- ====================================================================
-- 3. CONSERTAR QUEM JÁ ESTÁ NO BANCO
-- Professores cadastrados antes desta migração ficaram sem perfil, e
-- alguns sem teacher_id. Não apaga nem sobrescreve nada: só preenche o
-- que está faltando.
-- ====================================================================
DO $$
DECLARE
    r          RECORD;
    alvo       TEXT;
    criados    INTEGER := 0;
    vinculados INTEGER := 0;
BEGIN
    FOR r IN
        SELECT su.id, su.name, su.email, su.avatar_url, su.teacher_id
        FROM public.system_users su
        WHERE su.role = 'professor'
          AND su.auth_user_id IS NOT NULL
    LOOP
        alvo := COALESCE(NULLIF(btrim(COALESCE(r.teacher_id, '')), ''), r.id);

        IF NOT EXISTS (SELECT 1 FROM public.teachers WHERE id = alvo) THEN
            PERFORM public.ensure_teacher_profile(alvo, r.name, r.email, r.avatar_url);
            criados := criados + 1;
        END IF;

        IF r.teacher_id IS DISTINCT FROM alvo THEN
            UPDATE public.system_users SET teacher_id = alvo, updated_at = NOW() WHERE id = r.id;
            vinculados := vinculados + 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'Perfis de professor criados: %. Vínculos preenchidos: %.', criados, vinculados;
END $$;
