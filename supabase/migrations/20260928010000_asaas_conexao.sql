-- ====================================================================
-- SUPABASE MIGRATION: 20260928010000_asaas_conexao.sql
--
-- Conexão do professor com o Asaas, pelo botão "Conectar Asaas" do
-- Financeiro.
--
-- Diferente do Mercado Pago, o Asaas não tem "entrar e autorizar": o
-- professor gera a chave de API na conta dele (Integrações > Chave de API)
-- e cola no Aquagenda. A Edge Function asaas confere a chave, cadastra
-- sozinha o aviso de pagamento (webhook) na conta dele e guarda tudo aqui.
--
-- A tabela fica FECHADA para o app: RLS ligado, nenhuma política e sem
-- GRANT para anon/authenticated. Só a Edge Function, com a chave de
-- serviço, lê e grava. Com a chave de API, qualquer um mexeria na conta
-- do Asaas do professor -- ela nunca pode chegar ao navegador.
--
-- O QUE ESTA MIGRAÇÃO NÃO FAZ: não altera nenhuma linha existente. A
-- tabela nasce vazia.
--
-- Idempotente.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.asaas_contas (
    teacher_id    TEXT PRIMARY KEY REFERENCES public.teachers(id) ON DELETE CASCADE,
    api_key       TEXT NOT NULL,
    -- 'producao' ou 'sandbox', deduzido do começo da chave
    ambiente      TEXT NOT NULL DEFAULT 'producao',
    nome          TEXT,
    email         TEXT,
    -- O aviso de pagamento cadastrado na conta do professor
    webhook_id    TEXT,
    webhook_token TEXT NOT NULL,
    conectado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT asaas_contas_ambiente CHECK (ambiente IN ('producao', 'sandbox'))
);

COMMENT ON TABLE public.asaas_contas IS
    'Chave de API do Asaas de cada professor. Só a Edge Function asaas lê.';

ALTER TABLE public.asaas_contas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.asaas_contas FROM anon, authenticated;

NOTIFY pgrst, 'reload schema';

-- ====================================================================
-- Para conferir:
--
--   SELECT teacher_id, nome, ambiente, conectado_em FROM public.asaas_contas;
--
-- Logo depois de rodar, vem vazio. Cada professor que colar a chave em
-- "Conectar Asaas" ganha uma linha.
-- ====================================================================
