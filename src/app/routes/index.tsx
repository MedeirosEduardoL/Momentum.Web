import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { AccessLayout } from "@/app/layouts/access-layout";
import { AppLayout } from "@/app/layouts/app-layout";
import { NotFoundPage, RouteErrorPage } from "@/pages/system";
import { createAccountRoutes } from "./account.routes";
import { createBoardRoutes } from "./board.routes";
import { createCardRoutes } from "./card.routes";
import { createFeatureRoutes } from "./feature.routes";
import { RouteGuard } from "./guards";
import { createHomeRoutes } from "./home.routes";
import { createInvitationRoutes } from "./invitation.routes";
import { createOrganizationRoutes } from "./organization.routes";

function RootComponent() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Outlet />
    </div>
  );
}

function GuestArea() {
  return (
    <AccessLayout>
      <RouteGuard area="guest">
        <Outlet />
      </RouteGuard>
    </AccessLayout>
  );
}

function PublicArea() {
  return (
    <AccessLayout>
      <Outlet />
    </AccessLayout>
  );
}

function FirstAccessArea() {
  return (
    <AccessLayout>
      <RouteGuard area="first-access">
        <Outlet />
      </RouteGuard>
    </AccessLayout>
  );
}

function MemberArea() {
  return (
    <RouteGuard area="member">
      <AppLayout>
        <Outlet />
      </AppLayout>
    </RouteGuard>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteErrorPage,
});

const guestRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "guest",
  component: GuestArea,
});

const publicRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "public",
  component: PublicArea,
});

const firstAccessAreaRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "first-access",
  component: FirstAccessArea,
});

const memberRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "member",
  component: MemberArea,
});

const accountRoutes = createAccountRoutes(guestRoute, publicRoute);
const { invitationAcceptanceRoute } = createInvitationRoutes(publicRoute);
const { firstAccessRoute, organizationSettingsRoute } = createOrganizationRoutes(
  firstAccessAreaRoute,
  memberRoute
);
const { projectListRoute } = createHomeRoutes(memberRoute);
const cardRoutes = createCardRoutes(memberRoute);
const featureRoutes = createFeatureRoutes(memberRoute);
const { projectBoardRoute } = createBoardRoutes(memberRoute);

const routeTree = rootRoute.addChildren([
  guestRoute.addChildren([accountRoutes.signInRoute, accountRoutes.signUpRoute]),
  publicRoute.addChildren([
    accountRoutes.emailVerificationRoute,
    accountRoutes.passwordResetRequestRoute,
    accountRoutes.passwordResetRoute,
    invitationAcceptanceRoute,
  ]),
  firstAccessAreaRoute.addChildren([firstAccessRoute]),
  memberRoute.addChildren([
    projectListRoute,
    organizationSettingsRoute,
    cardRoutes.cardListRoute,
    cardRoutes.newCardRoute,
    cardRoutes.cardDetailRoute,
    cardRoutes.cardEditRoute,
    featureRoutes.projectHierarchyRoute,
    featureRoutes.newFeatureRoute,
    featureRoutes.newEpicRoute,
    featureRoutes.featureDetailRoute,
    featureRoutes.featureEditRoute,
    featureRoutes.epicDetailRoute,
    featureRoutes.epicEditRoute,
    featureRoutes.newEpicFeatureRoute,
    projectBoardRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
