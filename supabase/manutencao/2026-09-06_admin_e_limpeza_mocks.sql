-- ====================================================================
-- MANUTENÇÃO PONTUAL — 2026-09-06
-- Rodar no SQL Editor do Supabase, um PASSO de cada vez, na ordem.
--
-- Situação encontrada:
--   * As duas linhas de admin (user-admin-1, user-curtatche) estão sem
--     auth_user_id, então is_admin() é falso para todo mundo e ninguém
--     consegue gerenciar usuários, empresas ou vínculos.
--   * simon_cpor@yahoo.com.br é a única conta com login de verdade.
--   * 6 linhas são dados de demonstração que vazaram para produção.
--
-- Este arquivo NÃO é uma migração: não roda sozinho no deploy e não deve
-- ser reaplicado. É um conserto de dados, feito uma vez.
-- ====================================================================


-- ====================================================================
-- PASSO 1 — DIAGNÓSTICO (só leitura, não muda nada)
-- Rode e me mande o resultado ANTES de executar o passo 3.
-- ====================================================================

-- 1a. Quais professores existem hoje?
SELECT id, name, email, company_id FROM public.teachers ORDER BY id;

-- 1b. O que está pendurado em cada professor de demonstração?
--     Se vier tudo zero, apagar os mocks é seguro.
SELECT
    t.id AS professor,
    (SELECT count(*) FROM public.appointments a WHERE a.teacher_id = t.id) AS aulas,
    (SELECT count(*) FROM public.students    s WHERE s.teacher_id = t.id) AS alunos,
    (SELECT count(*) FROM public.services    sv WHERE sv.teacher_id = t.id) AS servicos,
    (SELECT count(*) FROM public.payments    p WHERE p.teacher_id = t.id) AS cobrancas
FROM public.teachers t
WHERE t.id IN ('prof-roberto', 'prof-carlos');

-- 1c. Confirma que a conta que vai virar admin realmente tem login
SELECT id, email, role, auth_user_id, teacher_id
FROM public.system_users
WHERE auth_user_id IS NOT NULL;


-- ====================================================================
-- PASSO 2 — DEVOLVER O CONTROLE (seguro, pode rodar já)
--
-- Promove simon_cpor@yahoo.com.br a admin e cria o perfil de professor
-- dele. Sem esse perfil, cadastrar aluno ou serviço quebraria: students,
-- services e appointments têm chave estrangeira para teachers.
--
-- Nada aqui apaga coisa alguma.
-- ====================================================================

DO $$
DECLARE
    alvo_email  TEXT := 'simon_cpor@yahoo.com.br';
    alvo_id     TEXT;
    alvo_nome   TEXT;
    alvo_avatar TEXT;
BEGIN
    SELECT id, name, avatar_url INTO alvo_id, alvo_nome, alvo_avatar
    FROM public.system_users
    WHERE lower(email) = alvo_email AND auth_user_id IS NOT NULL;

    IF alvo_id IS NULL THEN
        RAISE EXCEPTION 'Conta % não encontrada, ou está sem login no Supabase Auth.', alvo_email;
    END IF;

    -- Perfil de professor com o MESMO id da linha de usuário: é assim que
    -- get_current_teacher_id() resolve o tenant quando teacher_id está vazio.
    INSERT INTO public.teachers (id, name, role, specialty, bio, email, avatar_url)
    VALUES (
        alvo_id,
        alvo_nome,
        'Professor',
        '',
        '',
        alvo_email,
        COALESCE(alvo_avatar, '')
    )
    ON CONFLICT (id) DO NOTHING;

    UPDATE public.system_users
    SET role        = 'admin',
        teacher_id  = alvo_id,
        permissions = ARRAY['all_access', 'manage_users', 'manage_settings',
                            'view_finances', 'manage_teachers', 'manage_content'],
        status      = 'ativo',
        updated_at  = NOW()
    WHERE id = alvo_id;

    RAISE NOTICE 'Pronto: % agora é admin e dono do tenant %', alvo_email, alvo_id;
END $$;

-- Confere o resultado do passo 2
SELECT id, email, role, teacher_id, auth_user_id
FROM public.system_users
WHERE lower(email) = 'simon_cpor@yahoo.com.br';


-- ====================================================================
-- PASSO 3 — LIMPAR OS DADOS DE DEMONSTRAÇÃO
--
-- !! SÓ RODE DEPOIS DE VER O RESULTADO DO PASSO 1b !!
-- appointments e services apontam para teachers com ON DELETE CASCADE:
-- apagar prof-roberto leva junto as aulas e serviços dele. Se o passo 1b
-- mostrou números diferentes de zero, PARE e me chame antes.
--
-- Descomente as linhas abaixo para executar.
-- ====================================================================

-- -- 3a. Usuários de demonstração (nenhum tem login, ninguém perde acesso)
-- DELETE FROM public.system_users
-- WHERE auth_user_id IS NULL
--   AND id IN ('prof-roberto', 'prof-carlos', 'std-1', 'std-2',
--              'user-admin-1', 'user-assist-1', 'user-curtatche');

-- -- 3b. Perfis de professor de demonstração
-- DELETE FROM public.teachers WHERE id IN ('prof-roberto', 'prof-carlos');

-- -- 3c. Alunos de demonstração, se ainda existirem
-- DELETE FROM public.students WHERE id IN ('std-1', 'std-2');

-- -- Confere: deve sobrar só a conta real
-- SELECT id, email, role, teacher_id FROM public.system_users ORDER BY id;
-- SELECT id, name, email FROM public.teachers ORDER BY id;
