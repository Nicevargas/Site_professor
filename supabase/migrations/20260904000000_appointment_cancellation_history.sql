-- ====================================================================
-- SUPABASE MIGRATION: 20260904000000_appointment_cancellation_history.sql
-- Cancelar uma aula passa a marcar o registro como 'Cancelado' em vez de
-- apagá-lo, guardando quando e por quê. Idempotente.
-- ====================================================================

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancelled_at TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Consulta do histórico de cancelamentos por professor
CREATE INDEX IF NOT EXISTS idx_appointments_teacher_status ON public.appointments(teacher_id, status);
