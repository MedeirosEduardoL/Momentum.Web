---
paths:
  - "src/pages/**"
  - "src/app/routes/**"
  - "src/app/layouts/**"
---

# Páginas, rotas e guards

Página compõe, não orquestra. Rota usa TanStack Router e mora em `app/routes/`, nunca na feature.

## Página fina

`pages/<area>/<page>/index.tsx` compõe UI de features e widgets. Pode ler parâmetros de rota e
navegar; não tem query, mutation nem estado de domínio.

```tsx
import { CardList } from "@/features/card";

export function CardListPage() {
  return <CardList />;
}
```

```ts
export { CardListPage } from "./list";
```

## Rota com lazy loading

```tsx
const CardListPage = lazyRouteComponent(() =>
  import("@/pages/cards").then(module => ({ default: module.CardListPage }))
);

export function createCardRoutes(rootRoute: AnyRoute) {
  const cardListRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/cards",
    component: CardListPage,
  });

  return { cardListRoute };
}
```

As factories `create<Area>Routes` são compostas em `app/routes/index.tsx`.

O roteador só carrega antes de renderizar o chunk do `component` da própria rota. Quando a rota
precisa de um componente próprio — para ler parâmetro ou busca e entregar à página como prop —,
ligue-o à página com `withPagePreload`:

```tsx
function CardDetailRoute() {
  const { cardId } = useParams({ from: "/member/cards/$cardId" });

  return <CardDetailPage cardId={cardId} />;
}

const cardDetailRoute = createRoute({
  getParentRoute: () => memberRoute,
  path: "/cards/$cardId",
  component: withPagePreload(CardDetailRoute, CardDetailPage),
});
```

Sem isso a página lazy suspende no meio da renderização e o React acusa uso incorreto de `use()`
no console. `app/routes/index.test.ts` falha quando uma rota de página fica sem o carregamento.

## Guards

O guard mora em `app/routes/guards.tsx`, lê a sessão por uma abstração estável e decide entre
carregando, redirecionamento e conteúdo. Trata a inicialização antes de autorizar, usa `replace`
no redirect e centraliza a política de acesso — nada de comparar papel espalhado pelas páginas. A
sessão e os papéis nascem na Fase 3 (D-04).

## Regras

- Path em português, kebab-case, com o vocabulário do glossário (`/cards/$cardId`,
  `/chamados`); parâmetros tipados pelo router, nunca lidos da URL à mão.
- Rota nova exige registro em `app/routes/<area>.routes.tsx` e reexport da página em
  `pages/<area>/index.ts`.
- Uma página nunca importa de outra página.
- Layout em `app/layouts/` compõe widgets de navegação; não busca dado de domínio.
