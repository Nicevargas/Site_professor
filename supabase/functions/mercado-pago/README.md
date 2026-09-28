# Mercado Pago: como ativar (uma vez só, pela plataforma)

Depois de ativado, **cada professor** só precisa abrir o **Financeiro**, clicar em
**Conectar Mercado Pago**, entrar na conta dele e clicar em **Autorizar**.
Ele não copia chave, token nem código nenhum.

A partir daí:

- toda cobrança nova já sai com um link de pagamento (Pix, cartão ou boleto);
- o dinheiro cai direto na conta do Mercado Pago **do professor**;
- quando o aluno paga, a cobrança vira **Pago** sozinha.

Enquanto a plataforma não estiver ativada, o cartão do Mercado Pago simplesmente
não aparece no Financeiro. Nada quebra.

---

## Passo 1: criar a aplicação no Mercado Pago

Feito uma vez, na conta do Mercado Pago **da plataforma** (não na de um professor).

1. Entre em <https://www.mercadopago.com.br/developers/panel/app> e clique em **Criar aplicação**.
2. Dê um nome (ex.: `Aquagenda`), escolha **Pagamentos online** e o produto **Checkout Pro**.
3. Abra a aplicação criada e vá em **Editar aplicação** (ou **Configurações**).
   Em **URLs de redirecionamento**, coloque exatamente:

   ```
   https://SEU-PROJETO.supabase.co/functions/v1/mercado-pago/retorno
   ```

   (troque `SEU-PROJETO` pelo endereço do seu projeto no Supabase: é o mesmo
   que aparece em Project Settings > API > Project URL).
4. Em **Credenciais de produção**, ative as credenciais (o Mercado Pago pede
   alguns dados do negócio) e copie o **Client ID** e o **Client Secret**.

## Passo 2: criar as tabelas

No Supabase, abra **SQL Editor**, cole o arquivo
`supabase/migrations/20260928000000_mercado_pago_conexao.sql` inteiro e clique em **Run**.
Ele só cria duas tabelas vazias; não mexe em nenhum dado que já existe.

## Passo 3: publicar a função

No Supabase, **Edge Functions > Deploy a new function > Via Editor**:

1. Nome: `mercado-pago` (exatamente assim).
2. Cole o conteúdo de `supabase/functions/mercado-pago/index.ts`.
3. **Desligue "Verify JWT"** nas configurações da função. O Mercado Pago chama a
   função sem login do Supabase; a própria função confere quem é o professor.
4. Clique em **Deploy**.

Pela linha de comando, o equivalente é:

```bash
npx supabase functions deploy mercado-pago --no-verify-jwt
```

## Passo 4: guardar os segredos

Em **Edge Functions > Secrets**, crie:

| Nome | Valor |
|---|---|
| `MP_CLIENT_ID` | o Client ID do passo 1 |
| `MP_CLIENT_SECRET` | o Client Secret do passo 1 |
| `APP_URL` | `https://aquagenda.plataformaeducar.net` |

Os segredos ficam só no Supabase. Não coloque nenhum deles no código nem na Vercel.

## Passo 5: testar

1. Entre no app como professor e abra **Financeiro**.
2. Deve aparecer o cartão **Receba pelo Mercado Pago**. Clique em **Conectar Mercado Pago**.
3. Entre com a conta do Mercado Pago e clique em **Autorizar**. Você volta para o
   Financeiro com o aviso "Mercado Pago conectado!".
4. Crie uma cobrança pequena (R$ 1,00) para você mesma, pague pelo link e veja a
   cobrança virar **Pago** sozinha em alguns segundos.

---

## Dúvidas comuns

**O cartão do Mercado Pago não aparece no Financeiro.**
A função não está publicada, ou falta algum dos três segredos do passo 4.

**Volto do Mercado Pago com "Não deu para conectar".**
Quase sempre é a URL de redirecionamento do passo 1 diferente da que a função usa
(uma barra a mais, `http` no lugar de `https`, outro projeto). Ela precisa ser
idêntica. Também acontece se o professor demorar mais de 30 minutos na tela de autorizar.

**O aluno não vê a opção Pix na página do Mercado Pago.**
O professor precisa ter uma chave Pix cadastrada **dentro da conta do Mercado Pago**
dele (app do Mercado Pago > Pix > Minhas chaves).

**Quanto custa?**
A plataforma não cobra nada a mais. O Mercado Pago cobra do professor a taxa normal
dele por venda, que aparece na conta do Mercado Pago.

**Onde vejo erros?**
Supabase > Edge Functions > `mercado-pago` > Logs.

## Como funciona por dentro

- `POST /mercado-pago` (app, com login): `status`, `conectar`, `desconectar`, `cobrar`.
  Quem pode é decidido pelo banco, com as mesmas regras do resto do app
  (`is_tenant_owner`): professor, gestor com financeiro liberado e admin.
- `GET /mercado-pago/retorno`: volta do "Autorizar". Troca o código pelo token e
  guarda em `mercado_pago_contas`, tabela que o navegador não consegue ler.
- `POST /mercado-pago/aviso`: o Mercado Pago avisa que um pagamento mudou. A
  função não confia no aviso: busca o pagamento de volta no Mercado Pago com o
  token do professor, confere que a cobrança é dele e que o valor pago cobre o
  valor da cobrança, e só então marca **Pago**.
- O token vale 180 dias e é renovado sozinho na última semana.
