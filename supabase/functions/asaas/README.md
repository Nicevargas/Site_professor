# Asaas: como ativar (uma vez só, pela plataforma)

Diferente do Mercado Pago, aqui **não há aplicação nem segredo da plataforma**.
Cada professor usa a própria conta do Asaas e cola a chave dela no Aquagenda.

## Passo 1: criar a tabela

No Supabase do Aquagenda (projeto **site_prof**), abra **SQL Editor**, cole
`supabase/migrations/20260928010000_asaas_conexao.sql` inteiro e clique em **Run**.
Ele só cria uma tabela vazia; não mexe em nenhum dado que já existe.

## Passo 2: publicar a função

**Edge Functions > Deploy a new function > Via Editor**:

1. Nome: `asaas` (exatamente assim).
2. Cole o conteúdo de `supabase/functions/asaas/index.ts` e clique em **Deploy function**.
3. Em **Settings** da função, **desligue "Verify JWT"** e salve. O aviso de
   pagamento do Asaas chega sem login do Supabase; a função confere o token do aviso.

Não precisa de nenhum segredo novo.

---

## Para o professor

1. No Asaas (pelo computador): menu **Integrações > Chaves de API > Gerar chave de API**.
   A chave começa com `$aact_` e só aparece uma vez.
2. No Aquagenda: **Financeiro & Pix > Conectar Asaas**, cole a chave e clique em **Conectar**.

O Aquagenda confere a chave e cadastra sozinho, na conta do Asaas do professor,
o aviso de pagamento (webhook) "Aquagenda - baixa automática". Ele aparece no
Asaas em **Integrações > Webhooks** — não apague.

## Dúvidas comuns

**"O Asaas não aceitou essa chave."**
A chave foi copiada pela metade, foi apagada no Asaas, ou a conta ainda não foi
aprovada pelo Asaas (conta nova só libera a API depois de enviar os documentos).

**Conectou, mas diz que a baixa automática não foi ativada.**
O Asaas recusou criar o webhook. Confira em **Integrações > Webhooks** se já não
há 10 webhooks (é o limite) e clique em **Desconectar** e conecte de novo.

**Pede o CPF do aluno.**
O Asaas exige CPF (ou CNPJ) de quem paga. O Aquagenda pergunta só na primeira
cobrança de cada aluno; depois o aluno é reencontrado no Asaas pelo cadastro.
Cobrança avulsa (sem aluno cadastrado) pede o CPF toda vez.

**Não veio o código Pix.**
A conta do Asaas precisa de uma chave Pix cadastrada (no Asaas: **Pix > Minhas chaves**).

**"O Asaas só aceita cobranças a partir de R$ 5,00."**
É o valor mínimo do Asaas.

**O aluno recebe SMS ou e-mail do Asaas?**
Não. O Aquagenda cria o aluno no Asaas com os avisos do Asaas desligados, para
não gerar custo de SMS na conta do professor nem duplicar o que já vai pelo WhatsApp.

**Onde vejo erros?**
Supabase > Edge Functions > `asaas` > Logs.

## Como funciona por dentro

- `POST /asaas` (app, com login): `status`, `conectar` (com a chave), `desconectar`, `cobrar`.
  Quem pode é decidido pelo banco (`is_tenant_owner`), como no Mercado Pago.
- A chave fica em `asaas_contas`, tabela que o navegador não consegue ler, e nunca volta ao app.
- `cobrar` reaproveita cobrança já criada para o mesmo id (clicar duas vezes não duplica),
  cria a cobrança com `billingType: UNDEFINED` (o aluno escolhe Pix, boleto ou cartão) e
  pega o Pix Copia e Cola em `/payments/{id}/pixQrCode`.
- `POST /asaas/aviso`: confere o cabeçalho `asaas-access-token` contra o token sorteado
  para aquele professor e relê o pagamento no Asaas antes de dar baixa.
- Desconectar apaga a chave e remove o webhook da conta do professor.
