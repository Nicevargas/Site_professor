-- ====================================================================
-- SUPABASE MIGRATION: 20260928000000_mercado_pago_conexao.sql
--
-- Conexão do professor com o Mercado Pago, pelo botão "Conectar Mercado
-- Pago" do Financeiro.
--
-- O professor não copia chave nenhuma: ele entra na conta dele no site do
-- Mercado Pago e clica em "Autorizar". A Edge Function mercado-pago recebe a
-- autorização e guarda aqui o token que permite criar links de pagamento em
-- nome dele. O dinheiro cai direto na conta do professor.
--
-- As duas tabelas ficam FECHADAS para o app: RLS ligado e nenhuma política,
-- e ainda sem GRANT para anon/authenticated. Só a Edge Function, com a chave
-- de serviço, lê e grava. O navegador nunca vê o token -- quem tivesse o
-- token poderia mexer na conta do Mercado Pago do professor.
--
-- O QUE ESTA MIGRAÇÃO NÃO FAZ: não altera nenhuma linha existente. As
-- tabelas nascem vazias e só ganham linha quando alguém clica em conectar.
--
-- Idempotente.
-- ====================================================================

-- Uma conta do Mercado Pago por professor
CREATE TABLE IF NOT EXISTS public.mercado_pago_contas (
    teacher_id    TEXT PRIMARY KEY REFERENCES public.teachers(id) ON DELETE CASCADE,
    mp_user_id    TEXT NOT NULL,
    apelido       TEXT,
    email         TEXT,
    access_token  TEXT NOT NULL,
    refresh_token TEXT,
    expira_em     TIMESTAMPTZ,
    conectado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.mercado_pago_contas IS
    'Token do Mercado Pago de cada professor. Só a Edge Function mercado-pago lê.';

-- Pedido de conexão em andamento: liga a volta do Mercado Pago ao professor
-- que clicou. Sem isto, qualquer um poderia mandar a própria conta para o
-- cadastro de outro professor e receber os pagamentos dele.
CREATE TABLE IF NOT EXISTS public.mercado_pago_pedidos_conexao (
    estado     TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.mercado_pago_pedidos_conexao IS
    'Conexões com o Mercado Pago iniciadas e ainda não concluídas. Vale 30 minutos.';

ALTER TABLE public.mercado_pago_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mercado_pago_pedidos_conexao ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.mercado_pago_contas FROM anon, authenticated;
REVOKE ALL ON public.mercado_pago_pedidos_conexao FROM anon, authenticated;

-- Avisa a API do Supabase que existem tabelas novas
NOTIFY pgrst, 'reload schema';

-- ====================================================================
-- Para conferir:
--
--   SELECT teacher_id, apelido, conectado_em FROM public.mercado_pago_contas;
--
-- Logo depois de rodar, vem vazio. Cada professor que clicar em "Conectar
-- Mercado Pago" e autorizar ganha uma linha.
-- ====================================================================
