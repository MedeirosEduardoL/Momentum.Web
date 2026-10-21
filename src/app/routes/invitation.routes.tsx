import { createRoute, lazyRouteComponent, type AnyRoute } from "@tanstack/react-router";
import { useLinkToken } from "./use-link-token";
import { withPagePreload } from "./with-page-preload";

const InvitationAcceptancePage = lazyRouteComponent(() =>
  import("@/pages/invitation").then(module => ({ default: module.InvitationAcceptancePage }))
);

function InvitationAcceptanceRoute() {
  return <InvitationAcceptancePage token={useLinkToken()} />;
}

export function createInvitationRoutes<TPublicRoute extends AnyRoute>(publicRoute: TPublicRoute) {
  const invitationAcceptanceRoute = createRoute({
    getParentRoute: () => publicRoute,
    path: "/aceitar-convite",
    component: withPagePreload(InvitationAcceptanceRoute, InvitationAcceptancePage),
  });

  return { invitationAcceptanceRoute };
}
