import type { Account } from "@/features/account";
import { isOrganizationAdministrator, type Organization } from "@/features/organization";

export type RouteArea = "guest" | "member" | "first-access" | "organization-administrator";

export type AccessDecision =
  "loading" | "unavailable" | "content" | "sign-in" | "session-expired" | "first-access" | "home";

export type SessionSnapshot = {
  account: Account | null | undefined;
  organization: Organization | null | undefined;
  projectCount: number | undefined;
  hasFailed: boolean;
  hasExpired: boolean;
};

type FirstAccessNeed = "unknown" | "required" | "done";

const DECISION_BY_NEED: Record<
  Exclude<RouteArea, "guest">,
  Record<Exclude<FirstAccessNeed, "unknown">, AccessDecision>
> = {
  member: { required: "first-access", done: "content" },
  "first-access": { required: "content", done: "home" },
  "organization-administrator": { required: "first-access", done: "content" },
};

function assessFirstAccess({ organization, projectCount }: SessionSnapshot): FirstAccessNeed {
  if (organization === undefined) {
    return "unknown";
  }

  if (organization === null) {
    return "required";
  }

  if (!isOrganizationAdministrator(organization)) {
    return "done";
  }

  if (projectCount === undefined) {
    return "unknown";
  }

  return projectCount === 0 ? "required" : "done";
}

function isDeniedToMember(area: RouteArea, decision: AccessDecision, session: SessionSnapshot) {
  return (
    area === "organization-administrator" &&
    decision === "content" &&
    !isOrganizationAdministrator(session.organization)
  );
}

export function decideAccess(area: RouteArea, session: SessionSnapshot): AccessDecision {
  const waiting = session.hasFailed ? "unavailable" : "loading";

  if (session.account === undefined) {
    return waiting;
  }

  if (session.account === null && area === "guest") {
    return "content";
  }

  if (session.account === null) {
    return session.hasExpired ? "session-expired" : "sign-in";
  }

  if (area === "guest") {
    return "home";
  }

  const need = assessFirstAccess(session);

  if (need === "unknown") {
    return waiting;
  }

  const decision = DECISION_BY_NEED[area][need];

  return isDeniedToMember(area, decision, session) ? "home" : decision;
}
