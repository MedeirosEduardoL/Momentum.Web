---
name: teach
description: "Consolida conhecimento durável em ai/knowledge/ — propósito, motivo, invariantes, limitações e objetivos de uma parte do sistema — no formato que o hook de edição e as outras skills leem. Use quando o usuário explicar uma regra, decisão ou limite ('registre isso', 'isso não pode mudar'), quando uma entrega alterar comportamento coberto por conhecimento, e quando você descobrir no código uma regra de negócio que não está escrita em lugar nenhum."
---

# teach — consolidar conhecimento

Transforma o que o usuário sabe (ou o que você acabou de descobrir investigando) num registro
que outro agente vai encontrar sozinho antes de editar o código coberto.

O formato, as seções obrigatórias e as regras de escrita estão em
[`.claude/rules/knowledge.md`](../../rules/knowledge.md). **Leia antes de escrever o
primeiro arquivo** — o esquema é contrato, não sugestão: o `knowledge-match.sh`, o hook de
edição e as skills `get-knowledge` e `get-knowledge-conflicts-with-docs` dependem dele.

## Por que o rigor importa aqui

Conhecimento errado é pior que conhecimento ausente: ele é lido com confiança e produz decisão
errada. Memória que descreve como existente uma tela extinta meses antes faz qualquer agente
que a leia procurar código morto.

Daí as duas obrigações abaixo: **verificar antes de gravar** e **atualizar no mesmo commit**.

## Processo

### 1. Descobrir o que já existe

!`bash ai/scripts/knowledge-match.sh --all || true`

Se o assunto já tem conhecimento, **atualize o arquivo existente**. Conhecimento fragmentado
em dois arquivos é conhecimento que ninguém encontra inteiro.

### 2. Levantar o conteúdo

O usuário é a fonte do **porquê**, dos objetivos e dos limites — coisas que não estão no
código. Você é a fonte dos **fatos**: caminhos, nomes de símbolo, o que a query realmente faz.
Não peça ao usuário o que você pode ler.

Quando faltar decisão e não fato, chame a skill `grilling` para percorrer as ramificações em
rodadas em vez de disparar perguntas soltas.

### 3. Verificar cada afirmação antes de gravar

Nenhum invariante entra sem confirmação no código. Para cada `INV-n`, tenha rodado o `grep`,
aberto o arquivo ou conferido o `openapi.json` do Core que o sustenta — e coloque esse comando
na seção `VERIFICACAO`, para que a próxima revisão seja barata.

Se o usuário afirmar algo que o código contradiz, **não grave nem o dele nem o seu em
silêncio**: mostre os dois e pergunte. Quase sempre é conhecimento defasado do lado humano, e
essa conversa é o momento mais valioso da skill.

### 4. Escrever

`ai/knowledge/<id>.md`, a partir de [`_TEMPLATE.md`](../../../ai/knowledge/_TEMPLATE.md).
Cuidados que decidem se o registro vai servir:

- **`touches` estreito.** Aponte onde a violação aconteceria, não a árvore inteira. Glob largo
  faz todo diff acender o conhecimento, e o agente aprende a ignorá-lo — que é exatamente o
  fracasso que esta skill existe para evitar.
- **Invariante é afirmação verificável**, uma por bullet, numerada. "Todo HTML vindo da API passa
  pelo `MarkdownContent` de `shared/ui`" serve; "prefira sanitizar o HTML" não, porque não
  dá para dizer se foi violado.
- **Não repita o código.** O que a assinatura conta já está contado. Entra a alternativa
  descartada, o limite conhecido, o motivo.

Confirme o casamento antes de fechar:

```bash
ai/scripts/knowledge-match.sh <um-arquivo-que-deveria-casar>
```

### 5. Registrar a entrega

- Entrada em `ai/memory/changelog/<AAAA-MM-DD>.md` dizendo qual conhecimento nasceu ou mudou.
- Se a mudança nasceu de uma alteração de comportamento, a skill `deliver` já registra o
  changelog — o conhecimento entra **no mesmo commit** da mudança, nunca depois.

## Atualizar conhecimento existente

Este é o caminho mais comum depois que a base cresce, e o mais fácil de fazer errado.

- Suba `atualizado`.
- **Corrija no lugar.** Não anexe a versão nova embaixo da velha deixando as duas convivendo.
- Invariante que deixou de valer vira `~~INV-n~~ (removido em AAAA-MM-DD: motivo)`. **Não
  renumere os demais** — changelog, memória e conversas antigas citam o número.
- Conhecimento inteiro que deixou de valer recebe `status: revogado` e `revogado_por: <id>`.
  Não apague o arquivo: um agente que leu a versão antiga precisa achar o rastro.

## Quando não usar

- Fato que o código conta sozinho — assinatura, estrutura de pasta, o que o `git log` mostra.
- Nota de andamento de uma tarefa. Isso é changelog.
- Receita de como implementar. Isso é `.claude/rules/`.
- Detalhe narrativo de um assunto. Isso é `ai/memory/incremental/`, e os dois convivem: o
  incremental explica, o conhecimento fixa o que não pode quebrar sem conversa.
