import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { apiError } from "@/test/api-errors";
import {
  changeOrganizationMemberAiPermission,
  changeOrganizationMemberRole,
  getCurrentOrganization,
  listOrganizationMembers,
  removeOrganizationMember,
} from "./organization.service";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.patch).mockReset().mockResolvedValue({ data: null });
  vi.mocked(api.delete).mockReset().mockResolvedValue({ data: null });
});

describe("getCurrentOrganization", () => {
  it("adapta a organização do contrato para o tipo interno", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        organization_id: "org-1",
        name: "Lua Nova",
        role: "administrator",
        ai_enabled: true,
      },
    });

    await expect(getCurrentOrganization()).resolves.toEqual({
      id: "org-1",
      name: "Lua Nova",
      role: "administrator",
      isAiEnabled: true,
    });
    expect(api.get).toHaveBeenCalledWith("/api/v1/organizations/me");
  });

  it("devolve null para a conta que ainda não participa de uma organização", async () => {
    vi.mocked(api.get).mockRejectedValue(
      apiError(
        404,
        "OrganizationMembershipNotFound",
        "Você ainda não participa de uma organização."
      )
    );

    await expect(getCurrentOrganization()).resolves.toBeNull();
  });

  it("repassa os outros erros, inclusive outro 404", async () => {
    const notFound = apiError(404, "OrganizationNotFound", "Organização não encontrada.");
    vi.mocked(api.get).mockRejectedValue(notFound);

    await expect(getCurrentOrganization()).rejects.toBe(notFound);
  });
});

describe("listOrganizationMembers", () => {
  it("adapta os membros do contrato para o tipo interno", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          user_id: "user-1",
          name: "Ana Souza",
          email: "ana@exemplo.test",
          role: "administrator",
          ai_enabled: true,
        },
        {
          user_id: "user-2",
          name: "Bia Lima",
          email: "bia@exemplo.test",
          role: "member",
          ai_enabled: false,
        },
      ],
    });

    await expect(listOrganizationMembers()).resolves.toEqual([
      {
        userId: "user-1",
        name: "Ana Souza",
        email: "ana@exemplo.test",
        role: "administrator",
        isAiEnabled: true,
      },
      {
        userId: "user-2",
        name: "Bia Lima",
        email: "bia@exemplo.test",
        role: "member",
        isAiEnabled: false,
      },
    ]);
    expect(api.get).toHaveBeenCalledWith("/api/v1/organizations/me/members");
  });

  it("repassa a recusa do Core a quem não participa da organização", async () => {
    const denied = apiError(403, "AccessDenied", "Você não tem acesso a este recurso.");
    vi.mocked(api.get).mockRejectedValue(denied);

    await expect(listOrganizationMembers()).rejects.toBe(denied);
  });
});

describe("changeOrganizationMemberRole", () => {
  it("manda o papel novo para a rota do membro", async () => {
    await changeOrganizationMemberRole({ userId: "user-2", role: "administrator" });

    expect(api.patch).toHaveBeenCalledWith("/api/v1/organizations/me/members/user-2", {
      role: "administrator",
    });
  });
});

describe("changeOrganizationMemberAiPermission", () => {
  it("concede a permissão de IA ao membro, sem mandar o papel", async () => {
    await changeOrganizationMemberAiPermission({ userId: "user-2", isAiEnabled: true });

    expect(api.patch).toHaveBeenCalledWith("/api/v1/organizations/me/members/user-2", {
      ai_enabled: true,
    });
  });

  it("desabilita a entrevista de card do membro", async () => {
    await changeOrganizationMemberAiPermission({ userId: "user-2", isAiEnabled: false });

    expect(vi.mocked(api.patch).mock.calls[0][1]).toEqual({ ai_enabled: false });
  });
});

describe("removeOrganizationMember", () => {
  it("remove o membro pela rota dele", async () => {
    await removeOrganizationMember("user-2");

    expect(api.delete).toHaveBeenCalledWith("/api/v1/organizations/me/members/user-2");
  });
});
