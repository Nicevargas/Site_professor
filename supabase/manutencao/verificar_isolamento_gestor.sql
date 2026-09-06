-- ====================================================================
-- TESTE DE ISOLAMENTO DO GESTOR
--
-- Prova que o gestor de uma academia não alcança a academia vizinha.
-- Rode DEPOIS da migração 20260906020000.
--
-- SEGURANÇA: nada é gravado. Todo o teste vive dentro de um bloco que
-- termina levantando uma exceção de propósito -- é isso que desfaz tudo.
-- O relatório vem NA MENSAGEM DE ERRO: ver "ERROR: RELATORIO ..." é o
-- funcionamento esperado, não uma falha.
--
-- O teste empresta a identidade de uma conta real por alguns
-- milissegundos e devolve tudo no rollback.
-- ====================================================================

DO $$
DECLARE
    uid_teste   UUID;
    id_usuario  TEXT;
    papel_orig  TEXT;
    emp_orig    TEXT;
    rel         TEXT := '';
    falhas      INTEGER := 0;
    total       INTEGER := 0;

    -- helper de asserção
    resultado   BOOLEAN;

    -- ids descartáveis
    emp_a  TEXT := 'test-emp-a';
    emp_b  TEXT := 'test-emp-b';
    prof_a TEXT := 'test-prof-a';
    prof_b TEXT := 'test-prof-b';
BEGIN
    -- ------------------------------------------------------------------
    -- Quem vamos personificar: qualquer conta com login de verdade
    -- ------------------------------------------------------------------
    SELECT auth_user_id, id, role, company_id
      INTO uid_teste, id_usuario, papel_orig, emp_orig
      FROM public.system_users
     WHERE auth_user_id IS NOT NULL AND status = 'ativo'
     LIMIT 1;

    IF uid_teste IS NULL THEN
        RAISE EXCEPTION 'Não há nenhuma conta com login para emprestar identidade ao teste.';
    END IF;

    -- ------------------------------------------------------------------
    -- Cenário: duas academias, um professor em cada
    -- (auth.uid() é NULL aqui, então os gatilhos de proteção não atrapalham)
    -- ------------------------------------------------------------------
    INSERT INTO public.companies (id, name, status, manager_sees_finance)
    VALUES (emp_a, 'Academia A (teste)', 'ativa', FALSE),
           (emp_b, 'Academia B (teste)', 'ativa', FALSE);

    INSERT INTO public.teachers (id, name, role, company_id, slug)
    VALUES (prof_a, 'Professor da A', 'Professor', emp_a, 'test-prof-a'),
           (prof_b, 'Professor da B', 'Professor', emp_b, 'test-prof-b');

    -- A conta emprestada vira gestora da Academia A
    UPDATE public.system_users
       SET role = 'gestor', company_id = emp_a, teacher_id = NULL
     WHERE id = id_usuario;

    -- A partir daqui, o banco acha que quem fala é essa pessoa
    PERFORM set_config('request.jwt.claims',
                       json_build_object('sub', uid_teste::text, 'role', 'authenticated')::text,
                       TRUE);

    -- ------------------------------------------------------------------
    -- ASSERÇÕES
    -- ------------------------------------------------------------------
    resultado := public.is_company_manager();
    rel := rel || CASE WHEN resultado THEN '  OK   ' ELSE '  FALHA' END
        || ' | é reconhecida como gestora' || chr(10);
    total := total + 1;
    IF NOT resultado THEN falhas := falhas + 1; END IF;

    resultado := public.get_current_company_id() = emp_a;
    rel := rel || CASE WHEN resultado THEN '  OK   ' ELSE '  FALHA' END
        || ' | a empresa dela é a Academia A' || chr(10);
    total := total + 1;
    IF NOT resultado THEN falhas := falhas + 1; END IF;

    resultado := public.manages_teacher(prof_a);
    rel := rel || CASE WHEN resultado THEN '  OK   ' ELSE '  FALHA' END
        || ' | alcança o professor da PRÓPRIA academia' || chr(10);
    total := total + 1;
    IF NOT resultado THEN falhas := falhas + 1; END IF;

    resultado := NOT public.manages_teacher(prof_b);
    rel := rel || CASE WHEN resultado THEN '  OK   ' ELSE '  FALHA' END
        || ' | NÃO alcança o professor da academia vizinha  <<< o que importa' || chr(10);
    total := total + 1;
    IF NOT resultado THEN falhas := falhas + 1; END IF;

    resultado := public.is_tenant_staff(prof_a);
    rel := rel || CASE WHEN resultado THEN '  OK   ' ELSE '  FALHA' END
        || ' | vê agenda e alunos do professor dela' || chr(10);
    total := total + 1;
    IF NOT resultado THEN falhas := falhas + 1; END IF;

    resultado := NOT public.is_tenant_staff(prof_b);
    rel := rel || CASE WHEN resultado THEN '  OK   ' ELSE '  FALHA' END
        || ' | NÃO vê agenda da academia vizinha  <<< o que importa' || chr(10);
    total := total + 1;
    IF NOT resultado THEN falhas := falhas + 1; END IF;

    resultado := NOT public.is_tenant_owner(prof_a);
    rel := rel || CASE WHEN resultado THEN '  OK   ' ELSE '  FALHA' END
        || ' | financeiro FECHADO enquanto a empresa não libera' || chr(10);
    total := total + 1;
    IF NOT resultado THEN falhas := falhas + 1; END IF;

    -- Admin libera o financeiro para a Academia A
    PERFORM set_config('request.jwt.claims', '', TRUE);
    UPDATE public.companies SET manager_sees_finance = TRUE WHERE id = emp_a;
    PERFORM set_config('request.jwt.claims',
                       json_build_object('sub', uid_teste::text, 'role', 'authenticated')::text,
                       TRUE);

    resultado := public.is_tenant_owner(prof_a);
    rel := rel || CASE WHEN resultado THEN '  OK   ' ELSE '  FALHA' END
        || ' | financeiro ABRE quando a empresa libera' || chr(10);
    total := total + 1;
    IF NOT resultado THEN falhas := falhas + 1; END IF;

    resultado := NOT public.is_tenant_owner(prof_b);
    rel := rel || CASE WHEN resultado THEN '  OK   ' ELSE '  FALHA' END
        || ' | mesmo liberada, NÃO vê financeiro da vizinha  <<< o que importa' || chr(10);
    total := total + 1;
    IF NOT resultado THEN falhas := falhas + 1; END IF;

    -- Gestor sem empresa não gere nada
    PERFORM set_config('request.jwt.claims', '', TRUE);
    UPDATE public.system_users SET company_id = NULL WHERE id = id_usuario;
    PERFORM set_config('request.jwt.claims',
                       json_build_object('sub', uid_teste::text, 'role', 'authenticated')::text,
                       TRUE);

    resultado := NOT public.is_company_manager();
    rel := rel || CASE WHEN resultado THEN '  OK   ' ELSE '  FALHA' END
        || ' | gestor sem empresa não gere ninguém' || chr(10);
    total := total + 1;
    IF NOT resultado THEN falhas := falhas + 1; END IF;

    resultado := NOT public.is_tenant_staff(prof_a);
    rel := rel || CASE WHEN resultado THEN '  OK   ' ELSE '  FALHA' END
        || ' | gestor sem empresa não vê agenda nenhuma' || chr(10);
    total := total + 1;
    IF NOT resultado THEN falhas := falhas + 1; END IF;

    -- ------------------------------------------------------------------
    -- A exceção abaixo é o que DESFAZ tudo. Ela é esperada.
    -- ------------------------------------------------------------------
    RAISE EXCEPTION E'\n\nRELATORIO DO TESTE DE ISOLAMENTO\n%\n%\n(nada foi gravado: este erro existe para desfazer o teste)',
        rel,
        CASE WHEN falhas = 0
             THEN '>>> TUDO CERTO: as ' || total || ' verificacoes passaram.'
             ELSE '>>> ATENCAO: ' || falhas || ' verificacao(oes) FALHOU. Nao suba isso para producao.'
        END;
END $$;
