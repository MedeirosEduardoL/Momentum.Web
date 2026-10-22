---
name: get-knowledge
description: "Consulta ai/knowledge/ e devolve, para o código que a tarefa toca, para que serve, por que existe, invariantes, limitações e objetivos. Use ao planejar uma mudança, antes de escrever código, e quando o usuário perguntar por que algo é assim, o que não pode quebrar ou quais as restrições de uma parte do sistema."
---

# get-knowledge — consultar antes de editar

Responde à pergunta que precede qualquer edição: **o que eu preciso saber antes de mexer
aqui, que o código não me conta?**

## Uso

```bash
ai/scripts/knowledge-match.sh --all                    # o que existe consolidado
ai/scripts/knowledge-match.sh <path>...                # o que esses caminhos tocam
ai/scripts/knowledge-match.sh --diff                   # o que o diff atual toca
ai/scripts/knowledge-match.sh --diff main              # o mesmo, contra uma ref
```

Sai com **3** quando há conhecimento tocado e **0** quando não há, então serve em hook e em
condicional de script.

O hook de edição já devolve os invariantes na primeira edição de um arquivo coberto. Esta skill
serve para consultar antes — ao planejar — e para responder perguntas.

Conhecimento existente agora:

!`bash ai/scripts/knowledge-match.sh --all || true`

O script devolve os ids e os invariantes. **Leia o arquivo inteiro de cada id que casar** —
ele é curto de propósito, e é onde estão as limitações e os não-objetivos, que é justamente o
que o resumo não carrega.

## O que devolver ao usuário

Quando ele pergunta pelo conhecimento, entregue tudo o que o registro tem, nesta ordem, um
bloco por conhecimento:

```
<id> — <titulo>            [ativo | revogado]

PARA QUE SERVE   ...
POR QUE EXISTE   ...
INVARIANTES      INV-n: ...   (todos, numerados, na íntegra)
LIMITAÇÕES       ...
OBJETIVOS        ...
NÃO-OBJETIVOS    ...
COMO VERIFICAR   ...
```

Não resuma os invariantes. Eles são o que o usuário precisa ver por inteiro para decidir se
o que quer fazer é permitido — e um invariante encurtado deixa de ser verificável.

Se nada casar, diga isso claramente: *"nenhum conhecimento consolidado cobre esses
caminhos"*. Ausência é informação — significa que a área está livre, e que talvez valha um
`/teach` depois da entrega.

## Quando o pedido fere um invariante

É aqui que a skill paga o custo de existir. Antes de qualquer edição:

1. **Pare. Não implemente**, nem parcialmente, nem "para mostrar como ficaria".
2. Cite o `INV-n` na íntegra e diga qual arquivo o registra.
3. Explique a **consequência concreta** de quebrá-lo, usando o `POR_QUE_EXISTE` e as
   `LIMITACOES` — o registro guarda a alternativa que já foi descartada e por quê, e quase
   sempre é essa a informação que falta na conversa.
4. Ofereça os caminhos: cumprir o invariante de outro jeito, ou revisá-lo deliberadamente.
5. **Só siga com confirmação explícita.** Um "pode ir" genérico não vale: o usuário precisa
   dizer que aceita quebrar aquele invariante nomeado.

Se ele confirmar, a mudança passa a exigir `/teach` na mesma entrega, para o registro parar
de descrever um mundo que não existe mais.

Vale a pena resistir à tentação de tratar isso como burocracia. O invariante está ali porque
alguém já pagou para descobri-lo; a pergunta custa uma mensagem, e a regressão silenciosa que
ela evita costuma custar uma investigação inteira.
