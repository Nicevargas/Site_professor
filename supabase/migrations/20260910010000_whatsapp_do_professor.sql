-- ====================================================================
-- SUPABASE MIGRATION: 20260910010000_whatsapp_do_professor.sql
--
-- O telefone informado no cadastro passa a chegar ao professor.
--
-- O gatilho de cadastro já guardava o telefone em system_users.phone, mas ao
-- criar a linha em teachers inseria só id, nome, papel, especialidade, bio,
-- e-mail, avatar e slug -- whatsapp ficava de fora. O número chegava e se
-- perdia no caminho.
--
-- Consequência visível: o botão "Falar no WhatsApp" da vitrine montava
-- https://wa.me/ sem número nenhum. Abre o aplicativo sem destinatário, e o
-- visitante sai achando que falou com o professor.
--
-- O conserto é um gatilho em system_users em vez de mexer na função de
-- cadastro. A ordem ajuda: o gatilho de signup cria o professor ANTES de
-- inserir o system_users, então quando este dispara a linha já existe.
-- Reescrever a função de cadastro para carregar mais um parâmetro mexeria no
-- caminho crítico de toda conta nova, para ganhar a mesma coisa.
--
-- Idempotente.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Recupera o telefone de quem já se cadastrou
--
-- Só preenche quem está vazio: professor que digitou o número à mão em
-- "Configurações" tem a versão mais recente, e ela não pode ser
-- sobrescrita pelo que veio do cadastro.
-- --------------------------------------------------------------------
UPDATE public.teachers t
   SET whatsapp = btrim(su.phone)
  FROM public.system_users su
 WHERE su.teacher_id = t.id
   AND NULLIF(btrim(su.phone), '') IS NOT NULL
   AND NULLIF(btrim(t.whatsapp), '') IS NULL;

-- --------------------------------------------------------------------
-- 2. Mantém os próximos em dia
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sincronizar_whatsapp_do_professor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.teacher_id IS NULL OR NULLIF(btrim(NEW.phone), '') IS NULL THEN
        RETURN NEW;
    END IF;

    -- Só preenche o que está vazio. O professor manda no próprio número:
    -- se ele apagou ou trocou em "Configurações", foi de propósito.
    UPDATE public.teachers
       SET whatsapp = btrim(NEW.phone)
     WHERE id = NEW.teacher_id
       AND NULLIF(btrim(whatsapp), '') IS NULL;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sincronizar_whatsapp_do_professor() IS
    'Leva o telefone do cadastro para teachers.whatsapp quando lá está vazio.';

DROP TRIGGER IF EXISTS trg_whatsapp_do_professor ON public.system_users;
CREATE TRIGGER trg_whatsapp_do_professor
    AFTER INSERT OR UPDATE OF phone, teacher_id ON public.system_users
    FOR EACH ROW EXECUTE FUNCTION public.sincronizar_whatsapp_do_professor();

-- ====================================================================
-- Para conferir:
--
--   SELECT t.name, t.whatsapp, su.phone
--     FROM public.teachers t
--     LEFT JOIN public.system_users su ON su.teacher_id = t.id
--    ORDER BY t.name;
--
-- Professor sem telefone nas duas colunas nunca informou um: precisa
-- preencher em Configurações. Até lá o botão de WhatsApp não aparece na
-- vitrine dele -- de propósito, porque botão que abre conversa vazia é pior
-- que botão nenhum.
-- ====================================================================
