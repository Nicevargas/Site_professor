# Novidade no GitHub → você envia no grupo com 1 toque

Substitui o fluxo do n8n + Evolution API (`automacoes/n8n/`), que dependia de uma VPS ligada o tempo todo. Aqui não tem servidor, não tem custo e não tem risco de bloqueio do número, porque quem envia é você, pelo seu próprio WhatsApp.

## Como funciona

1. Um arquivo novo `novidades/AAAA-MM-DD-assunto.md` chega no `main`.
2. O GitHub Actions (`.github/workflows/novidade-whatsapp.yml`) lê o texto e a imagem, com as mesmas regras de sempre (`automacoes/n8n/novidade.mjs`).
3. Ele abre uma **issue** atribuída a você: **📣 Enviar no grupo: \<título\>**. Você recebe por **e-mail** e no **app do GitHub**.
4. No celular, toque em **👉 Abrir para enviar no WhatsApp**. Abre a página `https://aquagenda.plataformaeducar.net/compartilhar-novidade.html`, já com a imagem e o texto.
5. Toque em **Enviar no WhatsApp**, escolha o **WhatsApp** e o grupo dos professores. O texto vai como legenda da imagem.
6. Feche a issue.

Se a legenda chegar vazia, toque nela e **cole**: a página copia o texto antes de abrir o WhatsApp.

No computador, a página mostra **Copiar texto** e **Baixar imagem** para enviar pelo WhatsApp Web.

## Regras que continuam valendo

- Só arquivo **adicionado** gera aviso. Editar uma novidade antiga não avisa de novo.
- Toda novidade precisa de imagem, e o texto tem até 1000 caracteres.
- Nunca coloque novidade de teste ou rascunho no `main`: o aviso sai na hora.

## Testar

```bash
node --test automacoes/whatsapp/aviso.teste.mjs
node automacoes/whatsapp/avisar.mjs --simular --arquivos novidades/2026-09-15-domingo-e-aula-gratuita.md
```

O `--simular` mostra o aviso e o link sem abrir issue.

## Segurança

- A página só aceita imagem deste repositório (`raw.githubusercontent.com/Nicevargas/Site_professor/`).
- O texto e a imagem vão depois do `#` no link, então não passam pelo servidor do site.
- A página não entra em buscadores (`noindex`) e não envia nada sozinha: só abre o WhatsApp quando você toca no botão.
