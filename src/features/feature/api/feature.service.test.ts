import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import {
  createFeature,
  deleteFeature,
  getFeature,
  listFeatures,
  setFeatureEpic,
  updateFeature,
} from "./feature.service";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const summaryDto = {
  feature_id: "feature-1",
  project_id: "project-1",
  epic_id: "epic-1",
  title: "Filtros da lista de cards",
  progress: 40,
  state: "in_progress",
  card_count: 3,
  created_at: "2026-10-12T09:00:00Z",
  updated_at: "2026-10-13T12:00:00Z",
};

const summary = {
  id: "feature-1",
  projectId: "project-1",
  epicId: "epic-1",
  title: "Filtros da lista de cards",
  progress: 40,
  state: "in_progress",
  cardCount: 3,
};

const featureDto = { ...summaryDto, description: "Filtrar por **tipo** e por estado." };
const feature = { ...summary, description: "Filtrar por **tipo** e por estado." };

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: featureDto });
  vi.mocked(api.patch).mockReset().mockResolvedValue({ data: featureDto });
  vi.mocked(api.put).mockReset().mockResolvedValue({ data: null });
  vi.mocked(api.delete).mockReset().mockResolvedValue({ data: null });
});

describe("listFeatures", () => {
  it("lista as features do projeto, adaptadas do contrato e sem descrição", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [summaryDto] });

    await expect(listFeatures("project-1")).resolves.toEqual([summary]);
    expect(api.get).toHaveBeenCalledWith("/api/v1/features", {
      params: { project_id: "project-1" },
    });
  });

  it("deixa sem epic a feature que o contrato traz sem epic", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ ...summaryDto, epic_id: null }] });

    await expect(listFeatures("project-1")).resolves.toEqual([{ ...summary, epicId: null }]);
  });
});

describe("getFeature", () => {
  it("lê a feature com a descrição", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: featureDto });

    await expect(getFeature("feature-1")).resolves.toEqual(feature);
    expect(api.get).toHaveBeenCalledWith("/api/v1/features/feature-1");
  });
});

describe("createFeature", () => {
  it("cria a feature no projeto, já dentro do epic escolhido", async () => {
    await expect(
      createFeature({
        projectId: "project-1",
        epicId: "epic-1",
        title: "Filtros da lista de cards",
        description: "",
      })
    ).resolves.toEqual(feature);

    expect(api.post).toHaveBeenCalledWith("/api/v1/features", {
      project_id: "project-1",
      title: "Filtros da lista de cards",
      description: "",
      epic_id: "epic-1",
    });
  });

  it("cria a feature sem epic", async () => {
    await createFeature({ projectId: "project-1", epicId: null, title: "Board", description: "" });

    expect(vi.mocked(api.post).mock.calls[0][1]).toMatchObject({ epic_id: null });
  });
});

describe("updateFeature", () => {
  it("manda o título e a descrição, com a descrição vazia como texto vazio", async () => {
    await expect(
      updateFeature({ featureId: "feature-1", title: "Filtros", description: "" })
    ).resolves.toEqual(feature);

    expect(api.patch).toHaveBeenCalledWith("/api/v1/features/feature-1", {
      title: "Filtros",
      description: "",
    });
  });
});

describe("deleteFeature", () => {
  it("exclui a feature pelo id", async () => {
    await deleteFeature("feature-1");

    expect(api.delete).toHaveBeenCalledWith("/api/v1/features/feature-1");
  });
});

describe("setFeatureEpic", () => {
  it("põe a feature no epic pela rota própria", async () => {
    await setFeatureEpic({ featureId: "feature-1", epicId: "epic-2" });

    expect(api.put).toHaveBeenCalledWith("/api/v1/features/feature-1/epic", { epic_id: "epic-2" });
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("tira a feature do epic com DELETE", async () => {
    await setFeatureEpic({ featureId: "feature-1", epicId: null });

    expect(api.delete).toHaveBeenCalledWith("/api/v1/features/feature-1/epic");
    expect(api.put).not.toHaveBeenCalled();
  });

  it("escapa o id que vai no caminho", async () => {
    await setFeatureEpic({ featureId: "a/b", epicId: null });

    expect(api.delete).toHaveBeenCalledWith("/api/v1/features/a%2Fb/epic");
  });
});
