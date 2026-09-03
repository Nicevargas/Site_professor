-- ====================================================================
-- SUPABASE MIGRATION: 20260903010000_teacher_branding_pix_and_video_status.sql
-- Garante as colunas usadas pela persistência de identidade visual, Pix,
-- modo férias e status (ativo/inativo) dos vídeos. Idempotente.
-- ====================================================================

-- 1. PROFESSORES: identidade visual, Pix, lembrete WhatsApp e modo férias
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS brand_name TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS show_logo BOOLEAN DEFAULT true;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#00687a';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#57dffe';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#004e5c';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS theme_preset TEXT DEFAULT 'ocean';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS pix_key TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS pix_key_type TEXT DEFAULT 'email';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS pix_receiver_name TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS pix_bank_name TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS default_payment_gateway TEXT DEFAULT 'pix';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS whatsapp_auto_reminder_8h BOOLEAN DEFAULT true;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS vacation_mode JSONB DEFAULT '{"enabled": false}'::jsonb;

-- 2. VÍDEOS: status ativo/inativo (oculto no site) e data de publicação
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS publish_date TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'institucional';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Geral';
CREATE INDEX IF NOT EXISTS idx_videos_teacher_active ON public.videos(teacher_id, active);

-- 3. INTEGRAÇÕES: uma linha por professor (id previsível para upsert)
ALTER TABLE public.integrations_config ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE public.integrations_config ADD COLUMN IF NOT EXISTS whatsapp_api_token TEXT;
ALTER TABLE public.integrations_config ADD COLUMN IF NOT EXISTS whatsapp_auto_reminder_8h BOOLEAN DEFAULT true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_integrations_config_teacher ON public.integrations_config(teacher_id);
