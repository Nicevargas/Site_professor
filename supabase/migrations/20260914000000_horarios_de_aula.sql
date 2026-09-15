-- ====================================================================
-- SUPABASE MIGRATION: 20260914000000_horarios_de_aula.sql
--
-- Cada professor define os próprios horários de aula por dia da semana.
--
-- O agendamento do site oferecia os mesmos horários para todo mundo
-- (09:00, 10:30, 14:00, 15:30 e 17:00, de segunda a sexta), escritos no
-- código. A tela nova "Horários de aula" grava a grade do professor aqui.
--
-- Formato: { "1": ["07:00", "18:00"], "3": ["07:00"] }
--   chave = dia da semana (0 = domingo ... 6 = sábado)
--   valor = horários de início, "HH:MM"
--
-- O QUE ESTA MIGRAÇÃO NÃO FAZ: não altera nenhuma linha existente. A coluna
-- nasce vazia (NULL) para todos, e NULL quer dizer "nunca configurou" -- o
-- site continua mostrando o horário padrão de antes. Só muda quem salvar a
-- grade na tela nova.
--
-- O app grava esta coluna sozinha (update só de class_schedule), sem passar
-- pelo salvamento do perfil inteiro. Nenhum outro dado do professor é
-- reescrito ao salvar horários.
--
-- Idempotente.
-- ====================================================================

ALTER TABLE public.teachers
    ADD COLUMN IF NOT EXISTS class_schedule jsonb;

COMMENT ON COLUMN public.teachers.class_schedule IS
    'Horários de aula por dia da semana: {"1": ["07:00"]}. NULL = nunca configurou (site usa o horário padrão).';

-- Só objeto JSON (ou vazio). Todas as linhas atuais são NULL, então a
-- verificação passa sem tocar em nada.
ALTER TABLE public.teachers
    DROP CONSTRAINT IF EXISTS teachers_class_schedule_objeto;
ALTER TABLE public.teachers
    ADD CONSTRAINT teachers_class_schedule_objeto
    CHECK (class_schedule IS NULL OR jsonb_typeof(class_schedule) = 'object');

-- Avisa a API do Supabase que existe coluna nova, sem esperar o cache vencer
NOTIFY pgrst, 'reload schema';

-- ====================================================================
-- Para conferir:
--
--   SELECT name, class_schedule FROM public.teachers ORDER BY name;
--
-- Logo depois de rodar, class_schedule está vazio para todos. Ele só é
-- preenchido quando o professor clica em "Salvar horários".
-- ====================================================================
