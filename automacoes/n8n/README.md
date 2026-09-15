# Novidade no GitHub → grupo de WhatsApp (n8n + Evolution API)

Quando uma novidade nova (`novidades/AAAA-MM-DD-assunto.md`) chega ao GitHub na branch `main`, este fluxo do n8n faz, sozinho:

1. Espera 3 minutos, para a Vercel terminar de publicar o site.
2. Lê o texto e a imagem da novidade direto do GitHub. O repositório é público, então não precisa de chave.
3. Publica no grupo do WhatsApp: imagem com o texto de legenda.
4. Anota que já publicou, para nunca repetir.

**Importante:** publica **direto**, sem aprovação. Revise o texto e o print **antes do commit**.

## O que publica e o que não publica

| Situação | Publica? |
|---|---|
| Arquivo novo `novidades/2026-09-20-assunto.md` no `main` | ✅ sim |
| Editar uma novidade que já existe | ❌ não repete |
| `novidades/README.md`, imagens, código | ❌ não |
| Push em outra branch | ❌ não |
| GitHub avisar duas vezes o mesmo push | ❌ não repete |
| Texto com mais de 1000 caracteres | ❌ para com erro (legenda do WhatsApp corta) |

As 3 novidades que já estavam no projeto antes da automação **não saem sozinhas**. Para mandar uma delas, use o teste (passo 5) com o ID do grupo no lugar do seu número.

## Arquivos

- `descobrir-id-do-grupo.json`: fluxo que lista seus grupos com nome e ID (passo 1).
- `publicar-novidades-whatsapp.json`: o fluxo que publica as novidades.
- `novidade.mjs` e `grupos.mjs`: as regras de cada fluxo.
- `gerar-fluxo.mjs`: monta os dois JSON a partir das regras. Rodar sempre que mexer nelas.
- `novidade.teste.mjs` e `grupos.teste.mjs`: testes, que rodam com `node --test automacoes/n8n/`.

Nenhum JSON leva chave ou senha. A chave da Evolution fica numa credencial do n8n.

---

## Como ligar (uma vez só)

### 1. Descobrir o ID do grupo (fluxo `descobrir-id-do-grupo.json`)

A instância da Evolution precisa estar conectada ao WhatsApp que **participa do grupo**.

1. No n8n: **Workflows → Add workflow → ⋯ (três pontinhos) → Import from File** → escolha `descobrir-id-do-grupo.json`.
2. Abra o nó **Buscar grupos na Evolution** → em *Credential for Header Auth* clique em **Create new credential**:
   - **Name:** `apikey`
   - **Value:** a chave da sua Evolution API

   Salve. Essa mesma credencial serve depois para o fluxo de publicar.
3. Abra o nó **Configuração** e preencha:
   - `evolutionUrl`: endereço da sua Evolution, ex.: `https://evolution.seudominio.com.br`
   - `instancia`: nome da instância conectada ao WhatsApp
   - `buscarNome` (opcional): parte do nome do grupo, ex.: `professores`. Maiúscula e acento não importam. Vazio lista todos.
4. Clique em **Test workflow**.
5. Clique no último nó, **Nome e ID de cada grupo**, e veja a tabela:

| Coluna | O que é |
|---|---|
| `grupo` | nome do grupo |
| `id` | **o que você copia**, termina em `@g.us` |
| `participantes` | quantas pessoas |
| `quemPodeEnviar` | se aparecer **só administradores**, o número conectado na Evolution precisa ser administrador do grupo |

Esse fluxo **só lê**: não envia nada para ninguém.

<details>
<summary>Alternativa sem n8n (terminal)</summary>

```bash
curl -H "apikey: SUA-CHAVE-DA-EVOLUTION" "https://SEU-EVOLUTION/group/fetchAllGroups/NOME-DA-INSTANCIA?getParticipants=false"
```

Na resposta, ache o grupo pelo `subject` (nome) e copie o `id`.
</details>

### 2. n8n: importar o fluxo de publicar

**Workflows → Add workflow → ⋯ → Import from File** → escolha `publicar-novidades-whatsapp.json`.

### 3. n8n: chave da Evolution

Abra o nó **Enviar pelo WhatsApp** → em *Credential for Header Auth*, **escolha a credencial `apikey` criada no passo 1**. Se ainda não criou, crie agora do mesmo jeito.

### 4. n8n: preencher a Configuração

Abra o nó **Configuração** e troque:

| Campo | O que colocar |
|---|---|
| `evolutionUrl` | o mesmo endereço do passo 1 |
| `instancia` | o mesmo nome de instância do passo 1 |
| `grupoJid` | o `id` do grupo copiado no passo 1 (termina em `@g.us`) |
| `numeroTeste` | seu WhatsApp com DDI e DDD, só números, ex.: `5551999999999` |
| `arquivoTeste` | a novidade usada no teste (já vem uma preenchida) |

Deixe `repositorio`, `branch` e `esperaMinutos` como estão.

### 5. Testar com o seu número

Clique em **Test workflow**, que dispara pelo nó *Testar com meu número*. A novidade de teste chega **só no seu WhatsApp**. Confira se a imagem e o texto chegaram certos.

### 6. Endereço secreto e ativar

1. Abra o nó **GitHub avisa** e troque o final do *Path* `aquagenda-novidades-TROQUE-ESTE-FINAL` por algo difícil de adivinhar, ex.: `aquagenda-novidades-k29fh37sd8`.
2. Salve e ligue o fluxo no botão **Active**, no topo.
3. No nó **GitHub avisa**, copie a **Production URL**.

### 7. GitHub: avisar o n8n a cada envio

No GitHub, abra o repositório **Nicevargas/Site_professor** → **Settings → Webhooks → Add webhook**:
- **Payload URL:** a Production URL do passo 6
- **Content type:** `application/json`
- **Which events:** *Just the push event*
- **Active:** marcado

Clique em **Add webhook**. O GitHub manda um aviso de teste (ping), que o fluxo ignora sem publicar nada.

Pronto: a próxima novidade que entrar no `main` vai para o grupo sozinha.

---

## Para desligar

No n8n, desligue o botão **Active** do fluxo de publicar. Nada mais é publicado.

## Cuidados

- A Evolution API **não é oficial do WhatsApp**. Uma mensagem por novidade é pouco, mas números que mandam muita mensagem automática podem ser bloqueados.
- Se o envio falhar, o n8n tenta 3 vezes. Se não der, a execução aparece com erro em **Executions**, e a novidade não é marcada como publicada.
- Se precisar republicar uma novidade, use o teste (passo 5) com o `grupoJid` no lugar do `numeroTeste`.
