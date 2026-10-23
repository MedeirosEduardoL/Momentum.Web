import {
  createRoute,
  lazyRouteComponent,
  Navigate,
  useParams,
  useSearch,
  type AnyRoute,
} from "@tanstack/react-router";
import { useProjectContextStore } from "@/app/stores/project-context.store";
import { toBoardGroupsSearch, toGroupsSearch } from "./groups-search";
import { withPagePreload } from "./with-page-preload";

const NewFeaturePage = lazyRouteComponent(() =>
  import("@/pages/feature").then(module => ({ default: module.NewFeaturePage }))
);

const NewEpicPage = lazyRouteComponent(() =>
  import("@/pages/feature").then(module => ({ default: module.NewEpicPage }))
);

const FeatureDetailPage = lazyRouteComponent(() =>
  import("@/pages/feature").then(module => ({ default: module.FeatureDetailPage }))
);

const FeatureEditPage = lazyRouteComponent(() =>
  import("@/pages/feature").then(module => ({ default: module.FeatureEditPage }))
);

const EpicDetailPage = lazyRouteComponent(() =>
  import("@/pages/feature").then(module => ({ default: module.EpicDetailPage }))
);

const EpicEditPage = lazyRouteComponent(() =>
  import("@/pages/feature").then(module => ({ default: module.EpicEditPage }))
);

const NewEpicFeaturePage = lazyRouteComponent(() =>
  import("@/pages/feature").then(module => ({ default: module.NewEpicFeaturePage }))
);

function GroupsRedirect() {
  const { projectId } = useParams({ from: "/member/projetos/$projectId/features" });
  const search = useSearch({ from: "/member/projetos/$projectId/features" });

  return (
    <Navigate
      to="/projetos/$projectId/boards"
      params={{ projectId }}
      search={toBoardGroupsSearch(search)}
      replace
    />
  );
}

function NewFeatureRoute() {
  const { projectId } = useParams({ from: "/member/projetos/$projectId/features/nova" });

  return <NewFeaturePage projectId={projectId} />;
}

function NewEpicRoute() {
  const { projectId } = useParams({ from: "/member/projetos/$projectId/epics/novo" });

  return <NewEpicPage projectId={projectId} />;
}

function FeatureDetailRoute() {
  const { featureId } = useParams({ from: "/member/features/$featureId" });
  const setProjectId = useProjectContextStore(state => state.setProjectId);

  return <FeatureDetailPage featureId={featureId} onProjectChange={setProjectId} />;
}

function FeatureEditRoute() {
  const { featureId } = useParams({ from: "/member/features/$featureId/editar" });

  return <FeatureEditPage featureId={featureId} />;
}

function EpicDetailRoute() {
  const { epicId } = useParams({ from: "/member/epics/$epicId" });
  const setProjectId = useProjectContextStore(state => state.setProjectId);

  return <EpicDetailPage epicId={epicId} onProjectChange={setProjectId} />;
}

function EpicEditRoute() {
  const { epicId } = useParams({ from: "/member/epics/$epicId/editar" });

  return <EpicEditPage epicId={epicId} />;
}

function NewEpicFeatureRoute() {
  const { epicId } = useParams({ from: "/member/epics/$epicId/features/nova" });

  return <NewEpicFeaturePage epicId={epicId} />;
}

export function createFeatureRoutes<TMemberRoute extends AnyRoute>(memberRoute: TMemberRoute) {
  const projectHierarchyRoute = createRoute({
    getParentRoute: () => memberRoute,
    path: "/projetos/$projectId/features",
    validateSearch: toGroupsSearch,
    component: GroupsRedirect,
  });

  const newFeatureRoute = createRoute({
    getParentRoute: () => memberRoute,
    path: "/projetos/$projectId/features/nova",
    component: withPagePreload(NewFeatureRoute, NewFeaturePage),
  });

  const newEpicRoute = createRoute({
    getParentRoute: () => memberRoute,
    path: "/projetos/$projectId/epics/novo",
    component: withPagePreload(NewEpicRoute, NewEpicPage),
  });

  const featureDetailRoute = createRoute({
    getParentRoute: () => memberRoute,
    path: "/features/$featureId",
    component: withPagePreload(FeatureDetailRoute, FeatureDetailPage),
  });

  const featureEditRoute = createRoute({
    getParentRoute: () => memberRoute,
    path: "/features/$featureId/editar",
    component: withPagePreload(FeatureEditRoute, FeatureEditPage),
  });

  const epicDetailRoute = createRoute({
    getParentRoute: () => memberRoute,
    path: "/epics/$epicId",
    component: withPagePreload(EpicDetailRoute, EpicDetailPage),
  });

  const epicEditRoute = createRoute({
    getParentRoute: () => memberRoute,
    path: "/epics/$epicId/editar",
    component: withPagePreload(EpicEditRoute, EpicEditPage),
  });

  const newEpicFeatureRoute = createRoute({
    getParentRoute: () => memberRoute,
    path: "/epics/$epicId/features/nova",
    component: withPagePreload(NewEpicFeatureRoute, NewEpicFeaturePage),
  });

  return {
    projectHierarchyRoute,
    newFeatureRoute,
    newEpicRoute,
    featureDetailRoute,
    featureEditRoute,
    epicDetailRoute,
    epicEditRoute,
    newEpicFeatureRoute,
  };
}
