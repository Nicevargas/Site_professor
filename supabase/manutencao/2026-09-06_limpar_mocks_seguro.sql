-- ====================================================================
-- LIMPEZA DOS DADOS DE DEMONSTRAÇÃO — versão que se protege sozinha
--
-- Pode rodar o arquivo inteiro de uma vez. Não precisa conferir nada
-- antes: o próprio script conta o que está pendurado nos professores de
-- demonstração e ABORTA sem apagar nada se encontrar qualquer registro
-- real. Ou apaga tudo, ou não apaga nada — não existe meio-termo.
--
-- Motivo do cuidado: appointments e services referenciam teachers com
-- ON DELETE CASCADE, e prof-roberto é o professor padrão do app. Apagar
-- sem olhar levaria aulas de verdade junto, em silêncio.
-- ====================================================================

DO $$
DECLARE
    mock_teachers TEXT[] := ARRAY['prof-roberto', 'prof-carlos'];
    mock_users    TEXT[] := ARRAY['prof-roberto', 'prof-carlos', 'std-1', 'std-2',
                                  'user-admin-1', 'user-assist-1', 'user-curtatche'];
    n_aulas     INTEGER;
    n_alunos    INTEGER;
    n_servicos  INTEGER;
    n_cobrancas INTEGER;
    n_admins    INTEGER;
    n_usuarios  INTEGER;
    n_professor INTEGER;
BEGIN
    -- 1. Trava de segurança: ninguém pode ficar sem admin com login
    SELECT count(*) INTO n_admins
    FROM public.system_users
    WHERE role = 'admin' AND auth_user_id IS NOT NULL AND status = 'ativo'
      AND NOT (id = ANY(mock_users));

    IF n_admins = 0 THEN
        RAISE EXCEPTION
            'ABORTADO: não sobraria nenhum admin com login. Rode o passo 2 antes.';
    END IF;

    -- 2. Trava de segurança: os professores de demonstração têm dado real?
    SELECT
        (SELECT count(*) FROM public.appointments WHERE teacher_id = ANY(mock_teachers)),
        (SELECT count(*) FROM public.students     WHERE teacher_id = ANY(mock_teachers)),
        (SELECT count(*) FROM public.services     WHERE teacher_id = ANY(mock_teachers)),
        (SELECT count(*) FROM public.payments     WHERE teacher_id = ANY(mock_teachers))
    INTO n_aulas, n_alunos, n_servicos, n_cobrancas;

    IF n_aulas + n_alunos + n_servicos + n_cobrancas > 0 THEN
        RAISE EXCEPTION
            'ABORTADO, nada foi apagado. Os professores de demonstração têm dados: % aula(s), % aluno(s), % serviço(s), % cobrança(s). Mova esses registros para o seu professor antes de limpar.',
            n_aulas, n_alunos, n_servicos, n_cobrancas;
    END IF;

    -- 3. Trava de segurança: nenhuma linha a apagar pode ter login
    IF EXISTS (
        SELECT 1 FROM public.system_users
        WHERE id = ANY(mock_users) AND auth_user_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION
            'ABORTADO: alguma linha de demonstração ganhou login de verdade. Confira antes de apagar.';
    END IF;

    -- Passou nas três travas: pode limpar
    DELETE FROM public.system_users WHERE id = ANY(mock_users);
    GET DIAGNOSTICS n_usuarios = ROW_COUNT;

    DELETE FROM public.students WHERE id IN ('std-1', 'std-2');

    DELETE FROM public.teachers WHERE id = ANY(mock_teachers);
    GET DIAGNOSTICS n_professor = ROW_COUNT;

    RAISE NOTICE 'Limpeza concluída: % usuário(s) e % professor(es) de demonstração removidos.',
        n_usuarios, n_professor;
END $$;

-- Como ficou
SELECT id, email, role, teacher_id, auth_user_id IS NOT NULL AS tem_login
FROM public.system_users ORDER BY role, id;

SELECT id, name, email FROM public.teachers ORDER BY id;
