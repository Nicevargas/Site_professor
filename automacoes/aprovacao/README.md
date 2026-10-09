# Novidade no GitHub → prévia no seu WhatsApp → você aprova → vai para o grupo

Envio automático com aprovação, pela VPS do "sistema whatsapp" (n8n + Evolution API,
número **curtatche**, grupo **AquAgenda**). Nada sai no grupo sem o seu toque.

O envio manual pela issue (`automacoes/whatsapp/README.md`) continua existindo, como plano B.

## Como funciona

1. Um arquivo novo `novidades/AAAA-MM-DD-assunto.md` chega no `main`.
2. O GitHub Actions avisa o n8n, numa chamada privada com token.
3. O n8n manda uma **prévia para o próprio número curtatche** (conversa "você"):
   a imagem com o texto, o **link de aprovação** e os anexos (mais imagens e vídeos), se houver.
4. Você abre o link. Aparece a novidade e o botão **Enviar no grupo**.
   Abrir o link **não envia nada**.
5. Você toca em **Enviar no grupo**. O número curtatche posta no grupo AquAgenda:
   a imagem com o texto e, em seguida, os anexos.

Se não quiser enviar, é só ignorar. O link vale 7 dias e funciona uma vez só.

## Mais imagens (opcional)

Para mandar mais de um print, cite os outros no fim da novidade. Eles seguem logo
depois da imagem principal, e o WhatsApp junta tudo num álbum:

```markdown
## Mais imagens
imagens/2026-10-09-outra-tela.png: o que o print mostra
```

## Vídeos (opcional)

Coloque o arquivo em `novidades/videos/` e cite na novidade:

```markdown
## Vídeos
videos/2026-10-09-tutorial-mercado-pago.mp4: como conectar o Mercado Pago
```

- Só `.mp4`, com até **16 MB** cada (limite do WhatsApp).
- **O repositório é público: todo vídeo colocado aqui fica público na internet.**
  Use só versões sem dado pessoal (conta bancária, e-mail, telefone, chave).

## Por que a aprovação é por um link no seu WhatsApp

O repositório e as issues são públicos. Um botão de aprovar na issue poderia ser
clicado por qualquer pessoa. O link de aprovação só existe na prévia que chega no
seu WhatsApp, e o código dele é sorteado a cada novidade.

## Arquivos

- `montar-fluxo.mjs`: monta o fluxo do n8n. Rodar sempre que mexer nele:
  `node automacoes/aprovacao/montar-fluxo.mjs > automacoes/aprovacao/novidade-com-aprovacao.json`
- `novidade-com-aprovacao.json`: o fluxo para importar. Traz `__GRUPO__` e
  `__NUMERO_PREVIA__` no lugar do grupo e do número, que não ficam no repositório.
- `previa.mjs`: o que o GitHub manda para o n8n. `enviar-previa.mjs`: o passo do Actions.
- `fluxo.teste.mjs`: testes, com `node --test automacoes/aprovacao/fluxo.teste.mjs`.

## Instalar (uma vez)

1. **Credencial do token** no n8n: tipo *Header Auth*, nome
   `Aquagenda - token da novidade`, cabeçalho `X-Aquagenda-Token`, valor = um código
   comprido e aleatório.
2. **Importar o fluxo**: trocar `__GRUPO__` pelo ID do grupo (termina em `@g.us`) e
   `__NUMERO_PREVIA__` pelo número curtatche com DDI (só números), importar no n8n e ativar.
   O fluxo usa a credencial `Evolution API - apikey`, que já existe.
3. **Segredos do repositório** (GitHub → Settings → Secrets → Actions):
   - `N8N_NOVIDADE_URL` = `https://n8n.curtatche.com.br/webhook/aquagenda-novidade`
   - `N8N_NOVIDADE_TOKEN` = o mesmo código do passo 1.

Sem os segredos, o passo do Actions só avisa que a prévia está desligada.

## Reenviar a prévia de uma novidade que já existe

Editar uma novidade não avisa de novo. Para mandar a prévia outra vez (por exemplo,
depois de acrescentar uma imagem), em **Actions → Avisar novidade para o WhatsApp →
Run workflow**, informe o arquivo (`novidades/AAAA-MM-DD-assunto.md`). A prévia nova
substitui a anterior, e o link antigo deixa de valer. Se a novidade já foi para o
grupo, o reenvio é recusado.

## Testar sem enviar

```bash
node automacoes/aprovacao/enviar-previa.mjs --simular --arquivos novidades/2026-10-09-celular-e-duracao.md
```

## Se a prévia não chegar

- **Actions → "Avisar novidade para o WhatsApp"**: o passo "Mandar a prévia" mostra o erro.
- **n8n → Executions** do fluxo "Aquagenda - novidade com aprovação".
- **Evolution**: o número curtatche precisa estar conectado (estado `open`). Se estiver
  `connecting` ou `close`, é preciso reconectar a instância.
