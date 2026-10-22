---
paths:
  - "package.json"
  - "package-lock.json"
  - "tsconfig*.json"
  - "vite.config.ts"
  - "eslint.config.js"
  - ".prettierrc*"
  - ".nvmrc"
  - ".env.example"
---

# Stack e ferramentas

Decisão D-03 do roadmap. Trocar uma peça estrutural exige adaptar as regras correspondentes antes
de implementar com ela, nunca substituir em silêncio.

| Responsabilidade | Tecnologia |
| --- | --- |
| Runtime | Node 22 (`.nvmrc`), npm |
| UI | React 19 + TypeScript `strict` |
| Build | Vite |
| Estilo | Tailwind CSS 4 |
| Rotas | TanStack Router |
| Estado remoto | TanStack Query |
| Estado de cliente | Zustand + Immer |
| Formulários | React Hook Form + Zod |
| HTTP | Axios |
| Feedback | Sonner |
| Ícones | lucide-react |
| Teste | Vitest + jsdom + Testing Library |
| Lint | ESLint flat com `typescript-eslint`, `react-hooks`, `boundaries`, `unicorn` |
| Formatação | Prettier + `eslint-config-prettier` |

## Carga inicial

O `package.json` declara `sideEffects` só para CSS: o bundler trata todo módulo de `src` como livre
de efeito colateral, e é isso que deixa o `index.ts` de uma feature ser importado pelo `app` sem
arrastar a feature inteira para a carga inicial. Módulo de `src` nunca depende de ser executado só
por ter sido importado; o que precisar disso entra na lista `sideEffects`, com o motivo no
conhecimento `carga-inicial`. Esse efeito só existe na build: confira mudança de chunk com
`npm run build` e `npx vite preview`, não com `npm start`.

## Gates

O `package.json` expõe `start`, `typecheck`, `lint`, `lint:fix`, `format`, `format:check`, `test`,
`build` e `quality` (typecheck + lint + test + build). O ESLint parte do `eslint.config.js` do
MedComite.Web: direção de camada por `boundaries/dependencies` (o `element-types` do MedComite foi
renomeado no boundaries 7), deep import bloqueado por `no-restricted-imports` (`@/pages/*/*`,
`@/widgets/*/*`, `@/features/*/*`), Radix barrado fora de `src/shared/ui`,
`unicorn/filename-case` em kebab-case e `no-console`. Cada área de `pages/` e cada feature é um
elemento próprio: página que importa outra área de página quebra o lint.

TypeScript fica na linha 5.9: o `typescript-eslint` aceita até a 6.0 e o `openapi-typescript`,
só a 5.

## Dependências

- Pacote novo só com o OK do usuário: diga o nome, o porquê e o que ele substitui. A permissão de
  `npm install` pede aprovação no `settings.json`.
- Versões fixadas pelo `package-lock.json`, sempre versionado; `npm ci` no CI.
- Variável de ambiente nova: `VITE_*` no `.env.example`, sem valor, e lida em `shared/config`.
  Segredo nunca é `VITE_*`: tudo que é `VITE_*` vai para o navegador.
