# Aquagenda

## Novidade publicada = conteúdo para o WhatsApp

Toda alteração publicada que o professor percebe (tela nova, mudança no jeito de usar, correção que ele notaria) sai com um conteúdo para o grupo de WhatsApp dos professores, **no mesmo commit**:

1. `novidades/AAAA-MM-DD-assunto.md`: texto pronto para colar, no modelo de `novidades/README.md`.
2. `novidades/imagens/AAAA-MM-DD-assunto.png`: print feito com `node scripts/print-novidade.mjs` (só modo demonstração, sem dado real).
3. Na resposta final, colar o texto para a Nice copiar.

**O envio para o grupo é da Nice, com 1 toque**: quando um `novidades/AAAA-MM-DD-assunto.md` novo chega no `main`, o GitHub Actions abre uma issue para ela com o link "Enviar no WhatsApp" (ver `automacoes/whatsapp/README.md`). O fluxo antigo do n8n + Evolution (`automacoes/n8n/`) foi desligado em 16/09/2026, quando a VPS saiu do ar. Por isso:
- revise texto e print antes do commit, porque o aviso sai na hora do push;
- texto com até 1000 caracteres, para caber na legenda da imagem;
- nunca crie arquivo de novidade de teste ou rascunho no `main`;
- nunca envie mensagem por outra via.

**Prévia com aprovação (desde 09/10/2026):** além da issue, o GitHub avisa o n8n da VPS (`automacoes/aprovacao/README.md`). A Nice recebe uma prévia no WhatsApp do número curtatche com um link; só quando ela toca em **Enviar no grupo** a novidade vai para o grupo AquAgenda, com os vídeos da seção opcional `## Vídeos`. O repositório é público: vídeo em `novidades/videos/` fica público, então só versões sem dado pessoal.

Alteração que o professor não vê não gera post.

Escrever sempre em português simples, com o nome dos botões exatamente como aparecem na tela.
