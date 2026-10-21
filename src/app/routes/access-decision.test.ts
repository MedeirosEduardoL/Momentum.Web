import { describe, expect, it } from "vitest";
import type { Account } from "@/features/account";
import type { Organization } from "@/features/organization";
import { decideAccess, type SessionSnapshot } from "./access-decision";

const account: Account = { id: "user-1", name: "Ana Souza", email: "ana@exemplo.test" };
const administrator: Organization = {
  id: "org-1",
  name: "Lua Nova",
  role: "administrator",
  isAiEnabled: false,
};
const member: Organization = { ...administrator, role: "member" };

function snapshot(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
  return {
    account: undefined,
    organization: undefined,
    projectCount: undefined,
    hasFailed: false,
    hasExpired: false,
    ...overrides,
  };
}

const anonymous = snapshot({ account: null });
const withoutOrganization = snapshot({ account, organization: null });
const administratorWithoutProject = snapshot({
  account,
  organization: administrator,
  projectCount: 0,
});
const administratorWithProject = snapshot({
  account,
  organization: administrator,
  projectCount: 2,
});
const memberWithoutTeam = snapshot({ account, organization: member });
const expired = snapshot({ account: null, hasExpired: true });

describe("decideAccess", () => {
  it("espera a sessão carregar antes de decidir, em qualquer área", () => {
    expect(decideAccess("guest", snapshot())).toBe("loading");
    expect(decideAccess("member", snapshot())).toBe("loading");
    expect(decideAccess("first-access", snapshot())).toBe("loading");
    expect(decideAccess("organization-administrator", snapshot())).toBe("loading");
  });

  it("avisa que a sessão não carregou quando a consulta falha", () => {
    expect(decideAccess("member", snapshot({ hasFailed: true }))).toBe("unavailable");
    expect(decideAccess("member", snapshot({ account, hasFailed: true }))).toBe("unavailable");
  });

  it("manda para o login quem abre rota autenticada sem sessão", () => {
    expect(decideAccess("member", anonymous)).toBe("sign-in");
    expect(decideAccess("first-access", anonymous)).toBe("sign-in");
    expect(decideAccess("organization-administrator", anonymous)).toBe("sign-in");
  });

  it("manda para o login, com o aviso, quem teve a sessão expirada no meio do uso", () => {
    expect(decideAccess("member", expired)).toBe("session-expired");
    expect(decideAccess("first-access", expired)).toBe("session-expired");
    expect(decideAccess("organization-administrator", expired)).toBe("session-expired");
  });

  it("não redireciona de novo quem já está no login depois de a sessão expirar", () => {
    expect(decideAccess("guest", expired)).toBe("content");
  });

  it("esquece a expiração quando há sessão de novo", () => {
    expect(decideAccess("member", { ...administratorWithProject, hasExpired: true })).toBe(
      "content"
    );
  });

  it("mostra o login e o cadastro a quem não tem sessão", () => {
    expect(decideAccess("guest", anonymous)).toBe("content");
  });

  it("manda para a área autenticada quem está logado e abre o login ou o cadastro", () => {
    expect(decideAccess("guest", snapshot({ account }))).toBe("home");
    expect(decideAccess("guest", withoutOrganization)).toBe("home");
  });

  it("espera a organização e, para o administrador, os projetos", () => {
    expect(decideAccess("member", snapshot({ account }))).toBe("loading");
    expect(decideAccess("member", snapshot({ account, organization: administrator }))).toBe(
      "loading"
    );
    expect(decideAccess("first-access", snapshot({ account, organization: administrator }))).toBe(
      "loading"
    );
  });

  it("manda para o primeiro acesso quem está logado e sem organização", () => {
    expect(decideAccess("member", withoutOrganization)).toBe("first-access");
    expect(decideAccess("first-access", withoutOrganization)).toBe("content");
  });

  it("manda para o primeiro acesso o administrador da organização sem projeto", () => {
    expect(decideAccess("member", administratorWithoutProject)).toBe("first-access");
    expect(decideAccess("first-access", administratorWithoutProject)).toBe("content");
  });

  it("deixa na área autenticada o administrador com projeto", () => {
    expect(decideAccess("member", administratorWithProject)).toBe("content");
    expect(decideAccess("first-access", administratorWithProject)).toBe("home");
  });

  it("deixa na área autenticada o membro que ainda não está em nenhum time", () => {
    expect(decideAccess("member", memberWithoutTeam)).toBe("content");
    expect(decideAccess("first-access", memberWithoutTeam)).toBe("home");
  });

  it("segue com o que já tem quando só uma atualização em segundo plano falhou", () => {
    expect(decideAccess("member", { ...administratorWithProject, hasFailed: true })).toBe(
      "content"
    );
  });

  it("mostra a área do administrador da organização só a ele", () => {
    expect(decideAccess("organization-administrator", administratorWithProject)).toBe("content");
    expect(decideAccess("organization-administrator", memberWithoutTeam)).toBe("home");
  });

  it("aplica à área do administrador as mesmas esperas e o primeiro acesso da área autenticada", () => {
    const loadingProjects = snapshot({ account, organization: administrator });

    expect(decideAccess("organization-administrator", snapshot({ account }))).toBe("loading");
    expect(decideAccess("organization-administrator", loadingProjects)).toBe("loading");
    expect(decideAccess("organization-administrator", withoutOrganization)).toBe("first-access");
    expect(decideAccess("organization-administrator", administratorWithoutProject)).toBe(
      "first-access"
    );
  });
});
