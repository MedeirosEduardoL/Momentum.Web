import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import {
  createProject,
  listProjectMembers,
  listProjects,
  removeProjectMember,
  setProjectMember,
} from "./project.service";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: {} });
  vi.mocked(api.put).mockReset().mockResolvedValue({ data: null });
  vi.mocked(api.delete).mockReset().mockResolvedValue({ data: null });
});

describe("listProjects", () => {
  it("adapta os projetos do contrato para o tipo interno", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        { project_id: "project-1", name: "Momentum", key: "MOM", role: "administrator" },
        { project_id: "project-2", name: "Suporte", key: "SUP", role: "member" },
      ],
    });

    await expect(listProjects()).resolves.toEqual([
      { id: "project-1", name: "Momentum", key: "MOM", role: "administrator" },
      { id: "project-2", name: "Suporte", key: "SUP", role: "member" },
    ]);
    expect(api.get).toHaveBeenCalledWith("/api/v1/projects");
  });

  it("devolve lista vazia para o membro que não está em nenhum time", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await expect(listProjects()).resolves.toEqual([]);
  });
});

describe("createProject", () => {
  it("cria o projeto com nome e chave e devolve o projeto criado, adaptado do contrato", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { project_id: "project-1", name: "Momentum", key: "MOM", role: "administrator" },
    });

    await expect(createProject({ name: "Momentum", key: "MOM" })).resolves.toEqual({
      id: "project-1",
      name: "Momentum",
      key: "MOM",
      role: "administrator",
    });
    expect(api.post).toHaveBeenCalledWith("/api/v1/projects", { name: "Momentum", key: "MOM" });
  });
});

describe("listProjectMembers", () => {
  it("adapta o time do contrato para o tipo interno", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        { user_id: "user-1", name: "Ana Souza", email: "ana@exemplo.test", role: "administrator" },
      ],
    });

    await expect(listProjectMembers("project-1")).resolves.toEqual([
      { userId: "user-1", name: "Ana Souza", email: "ana@exemplo.test", role: "administrator" },
    ]);
    expect(api.get).toHaveBeenCalledWith("/api/v1/projects/project-1/members");
  });
});

describe("setProjectMember", () => {
  it("manda só o papel no corpo, com o projeto e a pessoa no caminho", async () => {
    await setProjectMember({ projectId: "project-1", userId: "user-2", role: "member" });

    expect(api.put).toHaveBeenCalledWith("/api/v1/projects/project-1/members/user-2", {
      role: "member",
    });
  });
});

describe("removeProjectMember", () => {
  it("tira a pessoa do time pela rota dela", async () => {
    await removeProjectMember({ projectId: "project-1", userId: "user-2" });

    expect(api.delete).toHaveBeenCalledWith("/api/v1/projects/project-1/members/user-2");
  });
});
