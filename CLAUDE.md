# Aquagenda

## Novidade publicada = conteúdo para o WhatsApp

Toda alteração publicada que o professor percebe (tela nova, mudança no jeito de usar, correção que ele notaria) sai com um conteúdo para o grupo de WhatsApp dos professores, **no mesmo commit**:

1. `novidades/AAAA-MM-DD-assunto.md`: texto pronto para colar, no modelo de `novidades/README.md`.
2. `novidades/imagens/AAAA-MM-DD-assunto.png`: print feito com `node scripts/print-novidade.mjs` (só modo demonstração, sem dado real).
3. Na resposta final, colar o texto para a Nice copiar.

Nunca enviar nada pelo WhatsApp: quem envia é a Nice. Alteração que o professor não vê não gera post.

Escrever sempre em português simples, com o nome dos botões exatamente como aparecem na tela.
