---
paths:
  - "ai/memory/**"
---

# Memória (`ai/memory/`)

O estado do front — o que ele mostra, o que foi feito e por quê —, versionado com o código. O plano
do produto mora no roadmap do Core (`../Momentum.Core/ai/roadmap.md`), não aqui.

| Pasta | O que é | Ciclo |
| --- | --- | --- |
| `project/project-map.md` | Retrato consolidado do Web: telas, rotas, features, integração com o Core. | Muda por edição deliberada, só quando uma entrega altera o que o front é ou faz. |
| `changelog/<AAAA-MM-DD>.md` | O que foi entregue em cada dia. | Append-only: toda entrega anexa uma seção `##`; o passado não se reescreve. |
| `incremental/<assunto>.md` | Nota técnica por assunto: fluxo de tela, contrato consumido, regras não óbvias, armadilhas, o que ficou de fora. | Estado atual, corrigido a cada entrega. |

## Changelog

Uma seção por entrega, com título curto e bullets do que mudou e do efeito observável:

```markdown
## Responsáveis no card

- O detalhe do card ganhou o seletor de responsáveis, com busca por nome.
- `useAssignCard` mostra no campo o erro `CardAssigneeOutsideProject` vindo do Core.
- Passo 4.4 do roadmap marcado como feito.
```

## Incremental

Assunto é uma área da tela ou um fluxo, não uma pasta: costuma cruzar feature, widget e página. O
índice `incremental/README.md` diz, por caminho, qual nota ler antes de mexer — se o assunto já tem
casa, escreva nela; arquivo novo (kebab-case) só para assunto novo, registrado no índice na mesma
entrega.

## Revisar não é anexar

`incremental/` e `project-map.md` descrevem o estado atual e apodrecem sozinhos. Ao entregar,
releia a memória da área tocada e corrija no lugar o que a entrega tornou falso: o que saiu sai da
descrição, o que mudou se reescreve no lugar, armadilha que deixou de existir sai da lista, link
morto sai.

Teste: um agente que lesse só a memória, sem abrir o código, chegaria a alguma conclusão falsa? Se
sim, ainda há correção pendente.

## O que não registrar

Estrutura de pastas, assinatura de função, o que o `git log` já conta, receitas que
`.claude/rules/` já cobre, regra de negócio do Core (ela mora na memória do Core).
