---
paths:
  - "src/**"
---

# Arquitetura — camadas, imports e promoção

FSD pragmático: feature gorda, página fina, single-file por componente. Em conflito com outra
regra deste repositório, esta prevalece para decisões de camada.

## Camadas

```
app  →  pages  →  widgets  →  features  →  shared
```

Import sempre da esquerda para a direita. Import lateral entre slices da mesma camada só pelo
`index.ts` e só na forma "leitura cruza, ação não". O ESLint trava a direção (`boundaries`) e o deep
import (`no-restricted-imports`) a partir do passo 2.2 do roadmap.

| Camada | O que mora | Não pode |
| --- | --- | --- |
| `app/` | Bootstrap: providers, `routes/<area>.routes.tsx`, `routes/guards.tsx`, layouts, stores globais. Único lugar que importa de `pages/` e conhece URLs. | Ser importada por camada inferior. |
| `pages/` | Telas finas: `pages/<area>/<page>/index.tsx`, reexportadas em `pages/<area>/index.ts`. | Ter `useQuery`, `useMutation` ou estado de domínio; importar de outra página. |
| `widgets/` | Composições com domínio usadas por 2+ páginas ou features. Arquivo único; pasta só se crescer. | Nascer antes do segundo uso. |
| `features/` | Uma feature por domínio: `ui/`, `model/`, `api/` e `index.ts` filtrado. | Exportar rota ou mutation; entregar UI de ação a outra feature. |
| `shared/` | Sem domínio: `ui/`, `api/`, `lib/`, `config/`, `types/`. | Conhecer qualquer conceito do glossário. |

## Reuso entre features — "leitura cruza, ação não"

| Permitido (via `index.ts`) | Proibido |
| --- | --- |
| `useGet*`, `useList*` (queries) | `use*Mutation` |
| UI de leitura passiva (`<CardSummaryItem />`) | Hooks de orquestração (`useEditCard`) |
| Tipos (`type CardSummary`) | UI de ação (`<EditCardForm />`), schemas de ação |

A página é quem compõe: a feature exporta o formulário autocontido (`<CreateProjectForm />`) para
a página, que pode entregá-lo como elemento a um componente de outra feature. O que não cruza é o
import de feature para feature.

## Promoção

```
O componente conhece algum conceito do glossário?
├── NÃO → shared/ui/
└── SIM → quantos lugares usam?
          ├── 1 uso  → features/<x>/ui/
          └── 2+ usos → widgets/
```

Formulário de ação usado por duas páginas continua na feature dona do domínio: widget não tem
`api/` nem schema, e feature não importa de `widgets/`.

## Antipadrões

- Importar mutation, orquestração ou UI de ação de outra feature.
- Importar de `pages/` fora de `app/routes/`.
- Deep import além do `index.ts` de outro slice.
- Página com query, mutation ou estado de domínio.
- Pasta `components/` dentro de feature ou widget.
- Feature exportando rota ou conhecendo URL.
- UI com domínio em `shared/ui`.
- Estado de servidor em Zustand (é Query).
- Validação manual em formulário (é Zod).
- Default export em componente.

## Glossário de arquitetura

| Termo | Definição |
| --- | --- |
| Slice | Unidade lógica: uma feature, um widget, uma área de pages. |
| Segment | Subpasta dentro do slice (`ui/`, `api/`, `model/`). |
| Public API | `index.ts` do slice — único ponto de import externo. |
| Página fina | Página que só compõe; sem estado, query ou mutation. |
| Promoção | Mover componente de feature para `widgets/` no segundo uso. |
