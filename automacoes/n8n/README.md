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

- `publicar-novidades-whatsapp.json`: o fluxo para importar no n8n (não tem chave nenhuma).
- `novidade.mjs`: as regras (quais arquivos, como ler o texto, o que mandar para a Evolution).
- `gerar-fluxo.mjs`: monta o JSON a partir de `novidade.mjs`. Rodar sempre que mexer nas regras.
- `novidade.teste.mjs`: testes, que rodam com `node --test automacoes/n8n/novidade.teste.mjs`.

---

## Como ligar (uma vez só)

### 1. Evolution API: pegar o ID do grupo

A instância da Evolution precisa estar conectada ao WhatsApp que participa do grupo, como administrador ou com permissão de enviar mensagem.

Para listar os grupos, troque os três valores em MAIÚSCULAS:

```bash
curl -H "apikey: SUA-CHAVE-DA-EVOLUTION" "https://SEU-EVOLUTION/group/fetchAllGroups/NOME-DA-INSTANCIA?getParticipants=false"
```

Na resposta, ache o grupo pelo `subject` (nome do grupo) e copie o `id`, que termina em `@g.us`.

### 2. n8n: importar o fluxo

No n8n: **Workflows → Add workflow → ⋯ (três pontinhos) → Import from File** → escolha `automacoes/n8n/publicar-novidades-whatsapp.json`.

### 3. n8n: chave da Evolution (credencial)

Abra o nó **Enviar pelo WhatsApp** → em *Credential for Header Auth* clique em **Create new credential**:
- **Name:** `apikey`
- **Value:** a chave da sua Evolution API

Salve. A chave fica guardada só no n8n, nunca no GitHub.

### 4. n8n: preencher a Configuração

Abra o nó **Configuração** e troque:

| Campo | O que colocar |
|---|---|
| `evolutionUrl` | endereço da sua Evolution, ex.: `https://evolution.seudominio.com.br` |
| `instancia` | nome da instância conectada ao WhatsApp |
| `grupoJid` | o ID do grupo do passo 1 (termina em `@g.us`) |
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

No n8n, desligue o botão **Active** do fluxo. Nada mais é publicado.

## Cuidados

- A Evolution API **não é oficial do WhatsApp**. Uma mensagem por novidade é pouco, mas números que mandam muita mensagem automática podem ser bloqueados.
- Se o envio falhar, o n8n tenta 3 vezes. Se não der, a execução aparece com erro em **Executions**, e a novidade não é marcada como publicada.
- Se precisar republicar uma novidade, use o teste (passo 5) com o `grupoJid` no lugar do `numeroTeste`.
