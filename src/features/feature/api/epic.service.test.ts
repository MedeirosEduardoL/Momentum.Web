import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import {
  createEpic,
  deleteEpic,
  getEpic,
  listBoardEpics,
  listEpics,
  updateEpic,
} from "./epic.service";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const summaryDto = {
  epic_id: "epic-1",
  project_id: "project-1",
  title: "Lista de cards",
  progress: 25,
  state: "in_progress",
  feature_count: 2,
  card_count: 8,
  created_at: "2026-10-12T09:00:00Z",
  updated_at: "2026-10-13T12:00:00Z",
};

const summary = {
  id: "epic-1",
  projectId: "project-1",
  title: "Lista de cards",
  progress: 25,
  state: "in_progress",
  featureCount: 2,
  cardCount: 8,
};

const epicDto = { ...summaryDto, description: "Tudo o que a lista precisa para a v1.0.0." };
const epic = { ...summary, description: "Tudo o que a lista precisa para a v1.0.0." };

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: epicDto });
  vi.mocked(api.patch).mockReset().mockResolvedValue({ data: epicDto });
  vi.mocked(api.delete).mockReset().mockResolvedValue({ data: null });
});

describe("listEpics", () => {
  it("lista os epics do projeto, adaptados do contrato e sem descrição", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [summaryDto] });

    await expect(listEpics("project-1")).resolves.toEqual([summary]);
    expect(api.get).toHaveBeenCalledWith("/api/v1/epics", { params: { project_id: "project-1" } });
  });
});

describe("listBoardEpics", () => {
  it("lista os epics de um board pela rota do board", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [summaryDto] });

    await expect(listBoardEpics("board-1")).resolves.toEqual([summary]);
    expect(api.get).toHaveBeenCalledWith("/api/v1/boards/board-1/epics");
  });
});

describe("getEpic", () => {
  it("lê o epic com a descrição", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: epicDto });

    await expect(getEpic("epic-1")).resolves.toEqual(epic);
    expect(api.get).toHaveBeenCalledWith("/api/v1/epics/epic-1");
  });
});

describe("createEpic", () => {
  it("cria o epic no projeto", async () => {
    await expect(
      createEpic({ projectId: "project-1", title: "Lista de cards", description: "" })
    ).resolves.toEqual(epic);

    expect(api.post).toHaveBeenCalledWith("/api/v1/epics", {
      project_id: "project-1",
      title: "Lista de cards",
      description: "",
    });
  });
});

describe("updateEpic", () => {
  it("manda o título e a descrição do epic", async () => {
    await expect(
      updateEpic({ epicId: "epic-1", title: "Lista", description: "Nova descrição" })
    ).resolves.toEqual(epic);

    expect(api.patch).toHaveBeenCalledWith("/api/v1/epics/epic-1", {
      title: "Lista",
      description: "Nova descrição",
    });
  });
});

describe("deleteEpic", () => {
  it("exclui o epic pelo id", async () => {
    await deleteEpic("epic-1");

    expect(api.delete).toHaveBeenCalledWith("/api/v1/epics/epic-1");
  });
});
