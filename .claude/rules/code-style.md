---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Estilo de código

A formatação mecânica é do Prettier e do ESLint; esta regra cobre o que a ferramenta não decide.

## Sem comentários

Nada de `//`, `/* */` ou `{/* */}`. O comentário é sintoma; o tratamento é extrair um nome.

```tsx
{card.status !== "done" && card.status !== "archived" && <AssignButton />}
```

vira

```tsx
{isOpenCard(card) && <AssignButton />}
```

Também fora de PR: `console.*`, `TODO` e `debugger`.

## Nomes

> Arquivos em kebab-case. Identificadores em PascalCase ou camelCase.

| Item | Arquivo | Identificador |
| --- | --- | --- |
| Página | `<page>/index.tsx` | PascalCase + `Page` |
| Componente | kebab `.tsx` | PascalCase |
| Hook | kebab `.ts` | camelCase com `use*` |
| Lógica de view | `logic.ts` ao lado do `index.tsx` | `useLogic` |
| Service | kebab + `.service.ts` | camelCase |
| Query | kebab + `.queries.ts` | `useGet*` / `useList*` |
| Mutation | kebab + `.mutations.ts` | `use*Mutation` |
| Query keys | kebab + `-api-keys.ts` | camelCase + `Keys` |
| Schema Zod | kebab + `.schema.ts` | camelCase + `Schema` |
| Store Zustand | kebab + `.store.ts` | `use*Store` |
| Tipo de domínio | kebab + `.types.ts` | PascalCase |
| Rotas | kebab + `.routes.tsx` | `create<Area>Routes` |
| Teste | mesmo nome + `.test.ts(x)` | — |

- Código em inglês; o termo do glossário (`../Momentum.Core/CONTEXT.md`) usa a mesma tradução do
  Core, da tabela "Vocabulário no código" de `../Momentum.Core/ai/memory/project/project-map.md`:
  card → `card`, responsável → `assignee`, chamado → `supportTicket`.
- Texto da UI em português, com o termo do glossário: "Responsável", nunca "Assignee" nem "Dono".

## Componentes

- Named export sempre (`export function CardSummary() {}`); nada de `export default`.
- Single-file em features e shared; pasta com `index.tsx` só em pages ou quando o componente ganha
  subcomponentes ou `logic.ts`.
- Componente pequeno: cresceu com estado, handlers e derivações, extraia o hook de orquestração
  (`features/<x>/model/hooks/use-<acao>.ts`) ou o `logic.ts` da view.
- Condição composta em JSX vira função nomeada.
- Toda UI que consome dados trata loading, erro e vazio.

## TypeScript

- `strict` ligado; nada de `any` — `unknown` e estreitamento. `as` só para o que o TypeScript não
  consegue provar, nunca para calar erro.
- Tipo do contrato vem do arquivo gerado do `openapi.json` (`src/shared/api/generated/`), adaptado
  no service; não redeclare à mão o formato da API.
- Union de literais em vez de enum.
