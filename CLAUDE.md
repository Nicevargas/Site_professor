# Aquagenda

## Novidade publicada = conteúdo para o WhatsApp

Toda alteração publicada que o professor percebe (tela nova, mudança no jeito de usar, correção que ele notaria) sai com um conteúdo para o grupo de WhatsApp dos professores, **no mesmo commit**:

1. `novidades/AAAA-MM-DD-assunto.md`: texto pronto para colar, no modelo de `novidades/README.md`.
2. `novidades/imagens/AAAA-MM-DD-assunto.png`: print feito com `node scripts/print-novidade.mjs` (só modo demonstração, sem dado real).
3. Na resposta final, colar o texto para a Nice copiar.

**A publicação no grupo é automática**: quando um `novidades/AAAA-MM-DD-assunto.md` novo chega no `main`, o n8n publica sozinho, sem aprovação (ver `automacoes/n8n/README.md`). Por isso:
- revise texto e print antes do commit, porque não tem volta depois do push;
- texto com até 1000 caracteres, para caber na legenda da imagem;
- nunca crie arquivo de novidade de teste ou rascunho no `main`;
- nunca envie mensagem por outra via.

Alteração que o professor não vê não gera post.

Escrever sempre em português simples, com o nome dos botões exatamente como aparecem na tela.
