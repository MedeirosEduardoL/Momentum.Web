---
paths:
  - "src/app/stores/**"
  - "src/app/providers/**"
  - "src/features/**/model/stores/**"
  - "src/features/**/model/contexts/**"
---

# Estado — onde mora cada um

| O quê | Onde mora |
| --- | --- |
| Cache de servidor | TanStack Query (`features/<x>/api/`) |
| Estado de formulário | React Hook Form, no hook de orquestração |
| Estado local de UI | `useState` no componente |
| Estado global de cliente (sessão, preferências) | Zustand em `app/stores/` |
| Estado de cliente de uma feature (filtros do board) | Zustand em `features/<x>/model/stores/` |
| Estado que só vive com o componente pai (wizard, modal) | Context em `features/<x>/model/contexts/` |
| Provider obrigatório de biblioteca | `app/providers/` |

**Regra de ouro:** estado de servidor é sempre Query, nunca Zustand.

## Zustand + Immer + Devtools

```ts
type BoardFiltersState = {
  assigneeId: string | null;
  setAssignee: (assigneeId: string | null) => void;
  reset: () => void;
};

export const useBoardFiltersStore = create<BoardFiltersState>()(
  devtools(
    immer(set => ({
      assigneeId: null,
      setAssignee: assigneeId =>
        set(
          state => {
            state.assigneeId = assigneeId;
          },
          false,
          "boardFilters/setAssignee"
        ),
      reset: () =>
        set(
          state => {
            state.assigneeId = null;
          },
          false,
          "boardFilters/reset"
        ),
    })),
    { name: "board-filters-store" }
  )
);
```

- Toda action nomeada `"<store>/<action>"`, para o Devtools.
- Fora do React, `useXStore.getState()`.
- Filtro que o usuário espera ver na URL (compartilhável) é search param do router, não store.
- Store de `app/stores/` é lido e gravado só pelo `app` (o componente da rota, um layout): ele
  entrega o valor e a ação à página por prop, porque página e feature não importam de `app/`. A
  rota com componente próprio liga a página com `withPagePreload` (`pages-and-routes.md`).
- Sem `persist` por padrão: o que precisa sobreviver ao recarregar é estado de servidor ou URL.
  A exceção é preferência de aparência do navegador (tema, navegação recolhida), que não é dado
  do usuário no Core nem cabe na URL; ela vai para o `localStorage`, nunca com token ou dado
  pessoal, e entra no inventário com o motivo.
- Em teste, volte o store ao estado inicial no `beforeEach`, pela própria action ou por
  `useXStore.setState`: ele é um módulo e sobrevive entre os testes do arquivo.

## Inventário — consulte antes de criar

| Store | Guarda | Quem lê e grava |
| --- | --- | --- |
| `useFirstBoardStore` — `app/stores/first-board.store.ts` | O projeto que o primeiro acesso acabou de criar e que ainda espera o diálogo do primeiro board (`pendingProject`), com `markPending` e `clearPending`. Só em memória: recarregar a página a apaga, e o diálogo não volta (pergunta 82 do roadmap). | A rota de `/primeiro-acesso` grava pelo `onProjectCreated` da página; a de `/` passa o projeto e o `clearPending` à página inicial, que abre o `FirstBoardDialog`. |

| `usePreferencesStore` — `app/stores/preferences.store.ts` | O tema (`light` ou `dark`) e a navegação lateral recolhida, com `toggleTheme` e `toggleNav`. Persistido no `localStorage` com a chave `PREFERENCES_STORAGE_KEY` (`momentum-preferences`), a exceção da regra acima: a aparência vale para o navegador, não para a conta. O script de `index.html` lê a mesma chave para aplicar o escuro antes do primeiro desenho. | O `App` aplica o tema no `<html>` e no `Toaster`; o `AppLayout` passa tema, navegação e as duas ações à barra superior e à navegação lateral. |
| `useProjectContextStore` — `app/stores/project-context.store.ts` | O último projeto aberto (`projectId`), com `setProjectId`. Só em memória. | O `AppLayout` grava o projeto da rota e o lê nas rotas de card, feature e epic, que não têm projeto no caminho; essas rotas passam o `setProjectId` à página como `onProjectChange`, e a página o chama pelo `ValueReporter` quando o item carrega. |

Ao criar um store, registre-o nesta tabela na mesma entrega.

## Sessão

Uma fonte só: o cache do TanStack Query. "Quem sou eu" e a organização são estado de servidor
(`GET /api/v1/accounts/me` e `GET /api/v1/organizations/me`), e o guard de `app/routes/` decide
por eles; não há store de sessão. Abrir, renovar e encerrar ficam em `session`, de
`shared/api/client.ts`, e o `app/` escuta essas mudanças para atualizar o cache. Token nunca em
`localStorage` ou `sessionStorage`, nem em store persistida: a sessão é um cookie httpOnly lido
pelo Kong (ADR 0003 do Core), que o JavaScript nunca vê (conhecimentos `renovacao-da-sessao` e
`guard-de-rota`).
