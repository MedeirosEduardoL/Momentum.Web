---
paths:
  - "ai/knowledge/**"
---

# Conhecimento consolidado (`ai/knowledge/`)

Formato de máquina: campos fixos, nomes estáveis, sem prosa de ligação. Um arquivo por
conhecimento, `<id>.md`, id em kebab-case, criado a partir de `ai/knowledge/_TEMPLATE.md`.

Cada arquivo responde o que o código não conta — para que serve, por que existe, quais os limites,
qual o objetivo — e fixa os invariantes que precisam continuar verdadeiros. O campo `touches` é o
que torna o conhecimento localizável: `ai/scripts/knowledge-match.sh` o usa, o hook de edição
mostra os invariantes na primeira edição de um arquivo coberto, e as skills `get-knowledge`,
`teach` e `get-knowledge-conflicts-with-docs` dependem deste esquema.

## Esquema

```yaml
---
id: kebab-case                      # igual ao nome do arquivo, sem .md
titulo: frase curta
status: ativo | revogado
criado: AAAA-MM-DD
atualizado: AAAA-MM-DD
revogado_por: <id>                  # só quando status: revogado
touches:                            # globs de caminho, casados por knowledge-match.sh
  - src/features/card/**
  - src/shared/ui/markdown-content.tsx
simbolos:                           # nomes procuráveis: classe, método, tabela, coluna, rota
  - MarkdownContent
  - useCardInterview
relacionados: [outro-id]
---
```

Seções obrigatórias, nesta ordem, com estes nomes exatos:

| Seção | Conteúdo | Forma |
| --- | --- | --- |
| `## PARA_QUE_SERVE` | a função no sistema | 1-3 bullets |
| `## POR_QUE_EXISTE` | a decisão e a alternativa descartada | 1-4 bullets, cada um com o porquê |
| `## INVARIANTES` | o que precisa seguir verdadeiro | lista `INV-n:` — uma afirmação verificável por bullet |
| `## LIMITACOES` | o que não cobre, e por quê | bullets |
| `## OBJETIVOS` | o que se pretende alcançar | bullets |
| `## NAO_OBJETIVOS` | o que foi deliberadamente deixado de fora | bullets |
| `## VERIFICACAO` | como confirmar que ainda vale | comandos ou caminhos concretos |

## Regras de escrita

- **Invariante é afirmação, não conselho.** "Todo HTML vindo da API passa pelo `MarkdownContent`
  de `shared/ui`" é invariante; "prefira sanitizar o HTML" não é, porque não dá para dizer se foi
  violado.
- **Um `INV-n` por afirmação**, para que o invariante ferido possa ser citado sozinho.
- **`touches` estreito.** Glob largo faz todo diff acender o conhecimento, e o aviso vira ruído
  ignorado. Aponte para onde a violação de fato aconteceria.
- **Sem repetir o código.** Entra o que ele não conta: a alternativa descartada, o limite
  conhecido, o motivo.
- **Numeração estável.** Invariante que deixou de valer vira `~~INV-n~~ (removido em AAAA-MM-DD:
  motivo)` sem renumerar os demais — changelog, memória e conversas citam o número.
- **Conhecimento que deixou de valer** recebe `status: revogado` e `revogado_por: <id>`; o arquivo
  não é apagado, para quem leu a versão antiga achar o rastro.
- **Só sobre código que existe.** Decisão ainda sem código mora no roadmap do produto
  (`../Momentum.Core/ai/roadmap.md`, D-nn); vira conhecimento quando o código nasce. Invariante
  do contrato da API é do Core; aqui entra o que o front garante.

## Relação com `ai/memory/`

| | `knowledge/` | `memory/incremental/` |
| --- | --- | --- |
| Forma | esquema fixo, verificável | nota técnica narrativa |
| Pergunta | isto ainda vale? | como isto funciona e onde é traiçoeiro? |
| Uso | conferido antes de editar; para o trabalho se ferido | lido para entender o assunto |
| Ciclo | revisto e possivelmente revogado | acumula entre releases |

Um assunto costuma ter os dois: o incremental explica, o conhecimento fixa o que não pode quebrar
sem conversa.
