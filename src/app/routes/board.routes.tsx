import {
  createRoute,
  lazyRouteComponent,
  useNavigate,
  useParams,
  useSearch,
  type AnyRoute,
} from "@tanstack/react-router";
import { fromBoardView, toBoardSearch, toBoardView } from "./board-search";
import { fromCardListFilters, toCardListFilters } from "./card-list-search";
import { withPagePreload } from "./with-page-preload";

const ProjectBoardPage = lazyRouteComponent(() =>
  import("@/pages/board").then(module => ({ default: module.ProjectBoardPage }))
);

function ProjectBoardRoute() {
  const { projectId } = useParams({ from: "/member/projetos/$projectId/boards" });
  const search = useSearch({ from: "/member/projetos/$projectId/boards" });
  const navigate = useNavigate();

  return (
    <ProjectBoardPage
      projectId={projectId}
      view={toBoardView(search)}
      onViewChange={view =>
        navigate({
          to: "/projetos/$projectId/boards",
          params: { projectId },
          search: fromBoardView(view),
        })
      }
      listFilters={toCardListFilters(search)}
      onListFiltersChange={filters =>
        navigate({
          to: "/projetos/$projectId/boards",
          params: { projectId },
          search: previous => ({ ...previous, ...fromCardListFilters(filters) }),
        })
      }
      openCardId={search.card}
      onOpenCardChange={cardId =>
        navigate({
          to: "/projetos/$projectId/boards",
          params: { projectId },
          search: previous => ({ ...previous, card: cardId }),
        })
      }
    />
  );
}

export function createBoardRoutes<TMemberRoute extends AnyRoute>(memberRoute: TMemberRoute) {
  const projectBoardRoute = createRoute({
    getParentRoute: () => memberRoute,
    path: "/projetos/$projectId/boards",
    validateSearch: toBoardSearch,
    component: withPagePreload(ProjectBoardRoute, ProjectBoardPage),
  });

  return { projectBoardRoute };
}
