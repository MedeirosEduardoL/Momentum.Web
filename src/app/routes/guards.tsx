import { useQuery } from "@tanstack/react-query";
import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { sessionExpiryQuery } from "@/app/providers/session-cache";
import { useGetCurrentAccount } from "@/features/account";
import { isOrganizationAdministrator, useGetCurrentOrganization } from "@/features/organization";
import { useListProjects } from "@/features/project";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { LoadingState } from "@/shared/ui/loading-state";
import { decideAccess, type RouteArea, type SessionSnapshot } from "./access-decision";

type RouteGuardProps = {
  area: RouteArea;
  children: ReactNode;
};

const REDIRECT_PATHS = {
  "sign-in": "/entrar",
  "first-access": "/primeiro-acesso",
  home: "/",
} as const;

function useSession() {
  const account = useGetCurrentAccount();
  const organization = useGetCurrentOrganization({ enabled: Boolean(account.data) });
  const projects = useListProjects({ enabled: isOrganizationAdministrator(organization.data) });
  const sessionExpiry = useQuery(sessionExpiryQuery);
  const queries = [account, organization, projects];

  const session: SessionSnapshot = {
    account: account.data,
    organization: organization.data,
    projectCount: projects.data?.length,
    hasFailed: queries.some(query => query.isError),
    hasExpired: sessionExpiry.data,
  };

  const retry = () => queries.filter(query => query.isError).forEach(query => void query.refetch());

  return { session, retry };
}

export function RouteGuard({ area, children }: RouteGuardProps) {
  const { session, retry } = useSession();
  const decision = decideAccess(area, session);

  if (decision === "loading") {
    return <LoadingState />;
  }

  if (decision === "unavailable") {
    return (
      <EmptyState
        title="Não foi possível carregar a sua sessão"
        description="Verifique a conexão e tente de novo."
        action={
          <Button variant="secondary" onClick={retry}>
            Tentar de novo
          </Button>
        }
      />
    );
  }

  if (decision === "content") {
    return children;
  }

  if (decision === "session-expired") {
    return <Navigate to="/entrar" search={{ aviso: "sessao-expirada" }} replace />;
  }

  return <Navigate to={REDIRECT_PATHS[decision]} replace />;
}
