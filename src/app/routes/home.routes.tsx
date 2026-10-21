import { createRoute, lazyRouteComponent, type AnyRoute } from "@tanstack/react-router";
import { useFirstBoardStore } from "@/app/stores/first-board.store";
import { withPagePreload } from "./with-page-preload";

const ProjectListPage = lazyRouteComponent(() =>
  import("@/pages/home").then(module => ({ default: module.ProjectListPage }))
);

function ProjectListRoute() {
  const pendingProject = useFirstBoardStore(state => state.pendingProject);
  const clearPending = useFirstBoardStore(state => state.clearPending);

  return <ProjectListPage firstBoardProject={pendingProject} onFirstBoardFinished={clearPending} />;
}

export function createHomeRoutes<TMemberRoute extends AnyRoute>(memberRoute: TMemberRoute) {
  const projectListRoute = createRoute({
    getParentRoute: () => memberRoute,
    path: "/",
    component: withPagePreload(ProjectListRoute, ProjectListPage),
  });

  return { projectListRoute };
}
