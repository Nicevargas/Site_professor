-- ====================================================================
-- PROMOVER UMA CONTA A ADMINISTRADOR DA PLATAFORMA
--
-- Use quando não houver nenhum admin com login funcionando, ou para dar
-- acesso de admin a mais alguém. Com um admin já ativo, o caminho normal
-- é a tela Usuários e permissões -- este script existe para o caso em que
-- ninguém consegue entrar.
--
-- Funciona nos dois cenários:
--   A) A pessoa JÁ tem cadastro no site  -> vira admin na hora.
--   B) A pessoa AINDA NÃO tem cadastro   -> fica um convite pendente;
--      ela se cadastra no site com ESTE MESMO e-mail e entra já como
--      admin (o gatilho on_auth_user_created faz a ligação).
--
-- ATENÇÃO: admin enxerga TODAS as academias e TODOS os professores.
-- Não é o papel para o dono de uma academia cliente -- para esse caso o
-- papel certo é 'gestor', que enxerga só a empresa dele.
-- ====================================================================

-- >>> TROQUE APENAS ESTAS DUAS LINHAS <<<
DO $$
DECLARE
    alvo_email TEXT := 'troque-pelo-email@exemplo.com';
    alvo_nome  TEXT := 'Nome de quem vai administrar';

    ja_existe  BOOLEAN;
    tem_login  BOOLEAN;
BEGIN
    alvo_email := lower(btrim(alvo_email));

    IF alvo_email = 'troque-pelo-email@exemplo.com' OR alvo_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
        RAISE EXCEPTION 'Edite alvo_email no topo do script antes de rodar.';
    END IF;

    SELECT TRUE, auth_user_id IS NOT NULL
      INTO ja_existe, tem_login
      FROM public.system_users
     WHERE lower(email) = alvo_email
     LIMIT 1;

    IF ja_existe THEN
        -- Já está na tabela: só muda o papel. Mantém login, vínculo e histórico.
        UPDATE public.system_users
           SET role        = 'admin',
               permissions = ARRAY['all_access', 'manage_users', 'manage_settings',
                                   'view_finances', 'manage_teachers', 'manage_content'],
               status      = CASE WHEN auth_user_id IS NULL THEN 'pendente' ELSE 'ativo' END,
               updated_at  = NOW()
         WHERE lower(email) = alvo_email;

        IF tem_login THEN
            RAISE NOTICE '% agora é admin. Saia e entre de novo no site para a sessão valer.', alvo_email;
        ELSE
            RAISE NOTICE '% virou admin, mas ainda não tem acesso: peça para criar o cadastro no site com ESTE e-mail.', alvo_email;
        END IF;
    ELSE
        -- Não existe ainda: deixa o convite pronto. Ao se cadastrar com
        -- este e-mail, o gatilho liga a conta e o papel admin prevalece.
        INSERT INTO public.system_users (id, name, email, role, status, permissions, created_at, updated_at)
        VALUES (
            'user-admin-' || substr(md5(alvo_email), 1, 8),
            alvo_nome,
            alvo_email,
            'admin',
            'pendente',
            ARRAY['all_access', 'manage_users', 'manage_settings',
                  'view_finances', 'manage_teachers', 'manage_content'],
            NOW(), NOW()
        );

        RAISE NOTICE 'Convite de admin criado para %. Agora crie o cadastro no site com ESTE e-mail.', alvo_email;
    END IF;
END $$;

-- Como ficou: quem é admin e quem consegue entrar
SELECT name,
       email,
       role,
       status,
       auth_user_id IS NOT NULL AS consegue_entrar
  FROM public.system_users
 WHERE role = 'admin'
 ORDER BY email;
