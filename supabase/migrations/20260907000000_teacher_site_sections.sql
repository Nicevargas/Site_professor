-- ====================================================================
-- SUPABASE MIGRATION: 20260907000000_teacher_site_sections.sql
--
-- O professor escolhe quais seções aparecem no menu e na página da
-- vitrine dele.
--
-- Antes o menu era fixo no código, com sete links -- inclusive para
-- seções sem nada cadastrado, levando o visitante a um trecho em branco.
--
-- NULL significa "nunca escolheu" e vale como todas: ninguém perde seção
-- por causa desta coluna nova. Quem escolher grava a lista.
--
-- 'inicio' é a apresentação e não pode ser desligada; a aplicação a
-- reinsere de qualquer jeito, e a checagem aqui evita gravar lixo.
--
-- Idempotente.
-- ====================================================================

ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS site_sections TEXT[];

COMMENT ON COLUMN public.teachers.site_sections IS
    'Seções da vitrine escolhidas pelo professor. NULL = todas. Ver src/utils/siteSections.ts.';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teachers_site_sections_check') THEN
        ALTER TABLE public.teachers
            ADD CONSTRAINT teachers_site_sections_check
            CHECK (
                site_sections IS NULL
                OR site_sections <@ ARRAY[
                    'inicio', 'curriculo', 'servicos', 'videos',
                    'galeria', 'depoimentos', 'faq'
                ]::TEXT[]
            );
    END IF;
END $$;
