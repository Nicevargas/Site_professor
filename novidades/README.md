# Novidades para o grupo de WhatsApp

Cada alteração publicada que o professor percebe no Aquagenda ganha um conteúdo pronto para divulgar no grupo de WhatsApp dos professores. Vale para tela nova, mudança no jeito de usar ou correção que ele notaria.

- **Para quem:** professores que já usam o Aquagenda.
- **O que tem:** texto pronto para colar + print da tela.
- **Quando:** no mesmo commit da alteração.
- **Quem envia:** a Nice copia e cola no grupo. Nada é enviado automaticamente.

Alteração que o professor não vê não ganha post: testes, código interno ou ajuste técnico sem mudança de uso.

## Arquivos

- `AAAA-MM-DD-assunto.md`: o texto, no modelo abaixo.
- `imagens/AAAA-MM-DD-assunto.png`: o print.

## Modelo

```markdown
# <Título curto da novidade>
Data: AAAA-MM-DD · Commit: <hash> · Para: professores que usam o Aquagenda

## Texto para o WhatsApp (copiar a partir daqui)
🆕 *Novidade no Aquagenda: <nome>*

<O que mudou, em 1–2 frases, do ponto de vista do professor>

*Como usar:*
1. <caminho exato: "No menu, clique em ...">
2. ...

Dúvidas? É só responder aqui no grupo. 💬

## Imagem
imagens/AAAA-MM-DD-assunto.png: <o que o print mostra>
```

## Regras do texto

- Português simples, sem termo técnico.
- Até uns 600 caracteres.
- `*negrito*` do WhatsApp e no máximo 3 emojis.
- Nome de botão e de menu **exatamente** como aparece na tela, conferido no código.
- Nunca prometer o que o sistema não faz.

## Como fazer o print

O print sai do **modo demonstração**: sem banco e só com dados de exemplo (Prof. Roberto). **Nunca aparece dado real** de aluno ou professor.

O script se recusa a rodar se houver `.env` ligando o Supabase.

```bash
node scripts/print-novidade.mjs --rota horarios --saida novidades/imagens/2026-09-14-horarios-de-aula.png
```

A `--rota` é o nome da tela no endereço, sem `#/` (`horarios`, `painel`, `entrar`, `agenda`). No Windows o Git Bash estraga textos que começam com `/`.

O script entra pelo botão de demonstração "Prof. Roberto". Esse botão só existe sem banco, então, se ele não aparecer, o print é cancelado.

Se algo der errado, o script fecha o site e o navegador sozinho e salva uma imagem do que estava na tela na pasta temporária (`aquagenda-print-erro.png`).

Passos opcionais, que rodam na ordem escrita:

| Opção | O que faz |
|---|---|
| `--preencher 'css::valor'` | preenche um campo |
| `--clicar "texto"` | clica no botão ou link com esse texto ou `aria-label` |
| `--rolar "css"` | rola até o elemento |
| `--esconder "css"` | tira do print o que o professor de verdade não vê (ex.: botões de demonstração) |
| `--esperar 1000` | espera, em milissegundos |
| `--sem-login` | tira sem entrar (tela de entrar) |

Tamanho padrão: 540×960 em escala 2, que dá uma imagem de 1080 px com a tela como aparece no celular.
