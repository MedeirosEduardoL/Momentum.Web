import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import {
  acceptInvitation,
  cancelInvitation,
  createInvitation,
  listPendingInvitations,
  previewInvitation,
  resendInvitation,
} from "./invitation.service";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: null });
  vi.mocked(api.delete).mockReset().mockResolvedValue({ data: null });
});

describe("previewInvitation", () => {
  it("manda o token e adapta a prévia do contrato para o tipo interno", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { organization_name: "Lua Nova", email: "bia@exemplo.test", account_exists: true },
    });

    await expect(previewInvitation("token-sintetico")).resolves.toEqual({
      organizationName: "Lua Nova",
      email: "bia@exemplo.test",
      accountExists: true,
    });
    expect(api.post).toHaveBeenCalledWith("/api/v1/invitation-previews", {
      token: "token-sintetico",
    });
  });
});

describe("acceptInvitation", () => {
  it("aceita o convite com o token, o nome e a senha", async () => {
    await acceptInvitation({ token: "token-sintetico", name: null, password: "senha-sintetica-1" });

    expect(api.post).toHaveBeenCalledWith("/api/v1/invitation-acceptances", {
      token: "token-sintetico",
      name: null,
      password: "senha-sintetica-1",
    });
  });
});

describe("listPendingInvitations", () => {
  it("adapta os convites pendentes do contrato para o tipo interno", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          invitation_id: "invitation-1",
          email: "bia@exemplo.test",
          role: "member",
          expires_at: "2026-10-19T12:00:00Z",
          projects: [{ project_id: "project-1", role: "administrator" }],
        },
      ],
    });

    await expect(listPendingInvitations()).resolves.toEqual([
      {
        id: "invitation-1",
        email: "bia@exemplo.test",
        role: "member",
        expiresAt: "2026-10-19T12:00:00Z",
        projects: [{ projectId: "project-1", role: "administrator" }],
      },
    ]);
    expect(api.get).toHaveBeenCalledWith("/api/v1/invitations");
  });
});

describe("createInvitation", () => {
  it("manda o e-mail, o papel na organização e os projetos em snake_case", async () => {
    await createInvitation({
      email: "bia@exemplo.test",
      role: "member",
      projects: [{ projectId: "project-1", role: "administrator" }],
    });

    expect(api.post).toHaveBeenCalledWith("/api/v1/invitations", {
      email: "bia@exemplo.test",
      role: "member",
      projects: [{ project_id: "project-1", role: "administrator" }],
    });
  });

  it("manda a lista de projetos vazia para o convite sem projeto", async () => {
    await createInvitation({ email: "bia@exemplo.test", role: "administrator", projects: [] });

    expect(api.post).toHaveBeenCalledWith("/api/v1/invitations", {
      email: "bia@exemplo.test",
      role: "administrator",
      projects: [],
    });
  });
});

describe("resendInvitation", () => {
  it("pede um envio novo do convite, sem corpo", async () => {
    await resendInvitation("invitation-1");

    expect(api.post).toHaveBeenCalledWith("/api/v1/invitations/invitation-1/deliveries");
  });
});

describe("cancelInvitation", () => {
  it("cancela o convite pela rota dele", async () => {
    await cancelInvitation("invitation-1");

    expect(api.delete).toHaveBeenCalledWith("/api/v1/invitations/invitation-1");
  });
});
