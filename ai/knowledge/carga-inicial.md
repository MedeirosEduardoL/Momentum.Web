---
id: carga-inicial
titulo: A carga inicial leva só o que a primeira tela usa, e toda rota carrega o chunk da página antes de renderizar
status: ativo
criado: 2026-10-13
atualizado: 2026-10-20
touches:
  - package.json
  - vite.config.ts
  - src/app/routes/*.routes.tsx
  - src/app/routes/with-page-preload.ts
  - src/shared/api/api-error.ts
  - src/pages/home/project-list/index.tsx
simbolos:
  - withPagePreload
  - lazyRouteComponent
  - sideEffects
  - isProblemDetails
  - FirstBoardDialog
  - useFirstBoardStore
  - usePreferencesStore
relacionados: [guard-de-rota, telas-de-card, telas-de-board]
---

## PARA_QUE_SERVE

- Mantém fora do primeiro carregamento o que a primeira tela não usa: formulários, Zod, React Hook
  Form, o diálogo do Radix, `marked` e DOMPurify chegam com a página que precisa deles.
- Garante que a página lazy de uma rota já chegou quando a rota renderiza.

## POR_QUE_EXISTE

- O `app` (guard, layouts, cache da sessão) importa o `index.ts` das features `account`,
  `organization` e `project`. Sem `sideEffects` no `package.json`, o bundler tem de supor que cada
  módulo reexportado executa algo ao ser importado, e a feature inteira ia para o chunk inicial,
  levando Zod, React Hook Form e o diálogo: 658 kB de JS, 206 kB em gzip. A alternativa descartada
  foi dar às features um segundo ponto de entrada só para o `app`, que quebra a regra de uma API
  pública por feature.
- O leitor do erro do Core (`api-error.ts`) roda em toda chamada HTTP. Com um schema Zod ali, o Zod
  inteiro ficava na carga inicial só para conferir cinco campos; a checagem virou função.
- O `lazyRouteComponent` do TanStack Router só é carregado pelo roteador quando é o `component` da
  rota. Renderizado dentro de outro componente, ele suspende com `use()` no meio da renderização e
  o React 19 acusa erro no console a cada primeira visita. As rotas que entregam parâmetro à página
  como prop precisam de um componente próprio, daí o `withPagePreload`. A alternativa descartada
  foi a página ler o parâmetro da rota sozinha: ela passaria a conhecer o caminho da rota.
- A página inicial é a primeira tela de quem já tem sessão, e o diálogo do primeiro board, que ela
  mostra uma vez no fim do primeiro acesso (pergunta 82), traz o formulário de board, com React
  Hook Form, Zod e o diálogo do Radix. Importado direto, ele faria `/` baixar 179 kB (57 kB em
  gzip) além da carga inicial, em vez de 4 kB. Por isso chega pelo `lazy` do React, dentro de um
  `Suspense`; o `lazyRouteComponent` não serve aqui, porque não é o `component` da rota.

## INVARIANTES

- INV-1: Toda rota de página tem `component.preload`: ou o `component` é o próprio
  `lazyRouteComponent`, ou é o componente da rota ligado à página por `withPagePreload`. A única
  rota-folha sem página é o redirecionamento de `/organizacao`.
- INV-2: `sideEffects` do `package.json` lista só `**/*.css`. Nenhum módulo de `src` é importado só
  pelo efeito de ser executado, fora o CSS e o `src/test/setup.ts`, que a build não usa.
- INV-3: `src/shared/api` não importa `zod`, e de `react-hook-form` só importa tipos.
- INV-4: Nenhum chunk da build passa de 500 kB, e o `index.html` só carrega o chunk de entrada e
  os que ele importa estaticamente.
- INV-5: `src/pages/home` só importa `@/features/board` por `import()` dinâmico, entregue ao
  `lazy` do React e renderizado dentro de um `Suspense`.

## LIMITACOES

- O efeito do `sideEffects` só aparece na build: em `npm start` e nos testes nada muda, e um módulo
  que dependa de efeito de importação quebraria só em produção.
- A tela de login continua baixando Zod e React Hook Form, porque tem formulário; o ganho é de
  quem já chega com sessão.
- React, o roteador, o TanStack Query, o Axios, o `tailwind-merge` e o Sonner seguem na carga
  inicial: a primeira tela usa todos. O Zustand e o Immer também, porque a rota de `/` lê a marca
  do primeiro board (`useFirstBoardStore`): com eles a carga inicial passou de 475 kB (153 kB em
  gzip) para 489 kB (159 kB). O layout de 2026-10-20 (barra superior, navegação lateral, o
  `persist` do Zustand nas preferências e os ícones dela) a levou a 500 kB (160 kB).
- O `index.html` tem um script inline, que aplica o tema escuro antes do primeiro desenho
  (`DESIGN.md`, "Tema"). Ele não é chunk nem importa nada; uma CSP futura precisa do hash dele.
- Quem acabou de criar o primeiro projeto espera, em `/`, o chunk do diálogo do primeiro board,
  que aparece um instante depois da lista.
- O nome dos chunks compartilhados é escolhido pelo bundler e muda com o código; nada no projeto
  depende dele.
- As bibliotecas não ficam num chunk separado do código do app: todo deploy troca o chunk de
  entrada inteiro.

## OBJETIVOS

- Primeira tela de quem já tem sessão com o mínimo de JS, sem trocar biblioteca.
- Console limpo ao abrir qualquer rota.

## NAO_OBJETIVOS

- Trocar Axios, Zod ou o roteador por alternativas menores.
- Pré-carregar as páginas por intenção (passar o mouse no link).

## VERIFICACAO

- `npx vitest run src/app/routes/index.test.ts` (INV-1).
- `rg -n '"sideEffects"' -A3 package.json` mostra só `**/*.css`; `rg -n '^import "' src` só
  devolve o CSS em `src/main.tsx` e o `src/test/setup.ts` (INV-2).
- `rg -n 'from "zod"|react-hook-form' src/shared/api --glob '!*.test.ts'` só devolve o
  `import type` de `apply-api-errors.ts` (INV-3).
- `npm run build`: nenhum aviso de chunk grande, e `dist/index.html` com um `script` e os
  `modulepreload` do que ele importa (INV-4). Em 2026-10-13: entrada de 344 kB mais 130 kB
  compartilhados, 153 kB em gzip. Em 2026-10-19: 489 kB no que o `index.html` carrega, 159 kB em
  gzip, e `/` soma 4 kB a isso. Em 2026-10-20: 500 kB, 160 kB em gzip.
- `rg -n "@/features/board" src/pages/home` só devolve o `import()` dentro do `lazy` (INV-5).
