import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { createCardRelation, deleteCardRelation, listCardRelations } from "./card-relation.service";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const relationDto = {
  card_relation_id: "relation-1",
  relation: "blocked_by",
  card: {
    card_id: "card-2",
    project_id: "project-2",
    identifier: "SUP-7",
    card_type: "issue",
    title: "Lista de chamados vazia",
    state_name: "Em andamento",
    state_category: "in_progress",
  },
};

const relation = {
  id: "relation-1",
  relation: "blocked_by",
  card: {
    id: "card-2",
    identifier: "SUP-7",
    type: "issue",
    title: "Lista de chamados vazia",
    stateName: "Em andamento",
  },
};

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: relationDto });
  vi.mocked(api.delete).mockReset().mockResolvedValue({ data: null });
});

describe("listCardRelations", () => {
  it("lista as relações do ponto de vista do card, com o resumo do outro card", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [relationDto] });

    await expect(listCardRelations("card-1")).resolves.toEqual([relation]);
    expect(api.get).toHaveBeenCalledWith("/api/v1/cards/card-1/relations");
  });

  it("devolve lista vazia para o card sem relação", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await expect(listCardRelations("card-1")).resolves.toEqual([]);
  });
});

describe("createCardRelation", () => {
  it("cria a relação no card consultado, sem inverter os cards", async () => {
    await expect(
      createCardRelation({ cardId: "card-1", relatedCardId: "card-2", relation: "blocked_by" })
    ).resolves.toEqual(relation);

    expect(api.post).toHaveBeenCalledWith("/api/v1/cards/card-1/relations", {
      related_card_id: "card-2",
      relation: "blocked_by",
    });
  });
});

describe("deleteCardRelation", () => {
  it("desfaz a relação pelo id dela", async () => {
    await deleteCardRelation("relation-1");

    expect(api.delete).toHaveBeenCalledWith("/api/v1/card-relations/relation-1");
  });
});
