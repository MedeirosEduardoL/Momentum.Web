import {
  createRoute,
  lazyRouteComponent,
  Navigate,
  Outlet,
  useParams,
  type AnyRoute,
} from "@tanstack/react-router";
import { OrganizationSettingsLayout } from "@/app/layouts/organization-settings-layout";
import { useFirstBoardStore } from "@/app/stores/first-board.store";
import { isOrganizationAdministrator, useGetCurrentOrganization } from "@/features/organization";
import { RouteGuard } from "./guards";
import { withPagePreload } from "./with-page-preload";

const FirstAccessPage = lazyRouteComponent(() =>
  import("@/pages/organization").then(module => ({ default: module.FirstAccessPage }))
);

const OrganizationMembersPage = lazyRouteComponent(() =>
  import("@/pages/organization").then(module => ({ default: module.OrganizationMembersPage }))
);

const OrganizationInvitationsPage = lazyRouteComponent(() =>
  import("@/pages/organization").then(module => ({ default: module.OrganizationInvitationsPage }))
);

const OrganizationProjectsPage = lazyRouteComponent(() =>
  import("@/pages/organization").then(module => ({ default: module.OrganizationProjectsPage }))
);

const ProjectTeamPage = lazyRouteComponent(() =>
  import("@/pages/organization").then(module => ({ default: module.ProjectTeamPage }))
);

const ProjectStatesPage = lazyRouteComponent(() =>
  import("@/pages/organization").then(module => ({ default: module.ProjectStatesPage }))
);

function FirstAccessRoute() {
  const markPending = useFirstBoardStore(state => state.markPending);

  return <FirstAccessPage onProjectCreated={markPending} />;
}

function OrganizationSettingsArea() {
  const organization = useGetCurrentOrganization();

  return (
    <OrganizationSettingsLayout showsInvitations={isOrganizationAdministrator(organization.data)}>
      <Outlet />
    </OrganizationSettingsLayout>
  );
}

function OrganizationSettingsIndexRoute() {
  return <Navigate to="/organizacao/membros" replace />;
}

function OrganizationInvitationsRoute() {
  return (
    <RouteGuard area="organization-administrator">
      <OrganizationInvitationsPage />
    </RouteGuard>
  );
}

function ProjectTeamRoute() {
  const { projectId } = useParams({ from: "/member/organizacao/projetos/$projectId/time" });

  return <ProjectTeamPage projectId={projectId} />;
}

function ProjectStatesRoute() {
  const { projectId } = useParams({ from: "/member/organizacao/projetos/$projectId/estados" });

  return <ProjectStatesPage projectId={projectId} />;
}

export function createOrganizationRoutes<
  TAreaRoute extends AnyRoute,
  TMemberRoute extends AnyRoute,
>(firstAccessAreaRoute: TAreaRoute, memberRoute: TMemberRoute) {
  const firstAccessRoute = createRoute({
    getParentRoute: () => firstAccessAreaRoute,
    path: "/primeiro-acesso",
    component: withPagePreload(FirstAccessRoute, FirstAccessPage),
  });

  const organizationSettingsRoute = createRoute({
    getParentRoute: () => memberRoute,
    path: "/organizacao",
    component: OrganizationSettingsArea,
  });

  const organizationSettingsIndexRoute = createRoute({
    getParentRoute: () => organizationSettingsRoute,
    path: "/",
    component: OrganizationSettingsIndexRoute,
  });

  const organizationMembersRoute = createRoute({
    getParentRoute: () => organizationSettingsRoute,
    path: "/membros",
    component: OrganizationMembersPage,
  });

  const organizationInvitationsRoute = createRoute({
    getParentRoute: () => organizationSettingsRoute,
    path: "/convites",
    component: withPagePreload(OrganizationInvitationsRoute, OrganizationInvitationsPage),
  });

  const organizationProjectsRoute = createRoute({
    getParentRoute: () => organizationSettingsRoute,
    path: "/projetos",
    component: OrganizationProjectsPage,
  });

  const projectTeamRoute = createRoute({
    getParentRoute: () => organizationSettingsRoute,
    path: "/projetos/$projectId/time",
    component: withPagePreload(ProjectTeamRoute, ProjectTeamPage),
  });

  const projectStatesRoute = createRoute({
    getParentRoute: () => organizationSettingsRoute,
    path: "/projetos/$projectId/estados",
    component: withPagePreload(ProjectStatesRoute, ProjectStatesPage),
  });

  return {
    firstAccessRoute,
    organizationSettingsRoute: organizationSettingsRoute.addChildren([
      organizationSettingsIndexRoute,
      organizationMembersRoute,
      organizationInvitationsRoute,
      organizationProjectsRoute,
      projectTeamRoute,
      projectStatesRoute,
    ]),
  };
}
