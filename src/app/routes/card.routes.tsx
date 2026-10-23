import {
  createRoute,
  lazyRouteComponent,
  Navigate,
  useParams,
  useSearch,
  type AnyRoute,
} from "@tanstack/react-router";
import { useProjectContextStore } from "@/app/stores/project-context.store";
import { toCardListSearch } from "./card-list-search";
import { withPagePreload } from "./with-page-preload";

const NewCardPage = lazyRouteComponent(() =>
  import("@/pages/card").then(module => ({ default: module.NewCardPage }))
);

const CardDetailPage = lazyRouteComponent(() =>
  import("@/pages/card").then(module => ({ default: module.CardDetailPage }))
);

const CardEditPage = lazyRouteComponent(() =>
  import("@/pages/card").then(module => ({ default: module.CardEditPage }))
);

function CardListRedirect() {
  const { projectId } = useParams({ from: "/member/projetos/$projectId/cards" });
  const search = useSearch({ from: "/member/projetos/$projectId/cards" });

  return (
    <Navigate
      to="/projetos/$projectId/boards"
      params={{ projectId }}
      search={{ ...search, exibir: "lista" }}
      replace
    />
  );
}

function NewCardRoute() {
  const { projectId } = useParams({ from: "/member/projetos/$projectId/cards/novo" });

  return <NewCardPage projectId={projectId} />;
}

function CardDetailRoute() {
  const { cardId } = useParams({ from: "/member/cards/$cardId" });
  const setProjectId = useProjectContextStore(state => state.setProjectId);

  return <CardDetailPage cardId={cardId} onProjectChange={setProjectId} />;
}

function CardEditRoute() {
  const { cardId } = useParams({ from: "/member/cards/$cardId/editar" });

  return <CardEditPage cardId={cardId} />;
}

export function createCardRoutes<TMemberRoute extends AnyRoute>(memberRoute: TMemberRoute) {
  const cardListRoute = createRoute({
    getParentRoute: () => memberRoute,
    path: "/projetos/$projectId/cards",
    validateSearch: toCardListSearch,
    component: CardListRedirect,
  });

  const newCardRoute = createRoute({
    getParentRoute: () => memberRoute,
    path: "/projetos/$projectId/cards/novo",
    component: withPagePreload(NewCardRoute, NewCardPage),
  });

  const cardDetailRoute = createRoute({
    getParentRoute: () => memberRoute,
    path: "/cards/$cardId",
    component: withPagePreload(CardDetailRoute, CardDetailPage),
  });

  const cardEditRoute = createRoute({
    getParentRoute: () => memberRoute,
    path: "/cards/$cardId/editar",
    component: withPagePreload(CardEditRoute, CardEditPage),
  });

  return { cardListRoute, newCardRoute, cardDetailRoute, cardEditRoute };
}
