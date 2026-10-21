import { describe, expect, it } from "vitest";
import type { EpicSummary, FeatureSummary } from "../types/feature.types";
import { describeEpic, describeFeature } from "./group-description";

const feature: FeatureSummary = {
  id: "feature-1",
  projectId: "project-1",
  epicId: null,
  title: "Filtros da lista de cards",
  progress: 40,
  state: "in_progress",
  cardCount: 3,
};

const epic: EpicSummary = {
  id: "epic-1",
  projectId: "project-1",
  title: "Lista de cards",
  progress: 25,
  state: "in_progress",
  featureCount: 2,
  cardCount: 8,
};

describe("describeFeature", () => {
  it("escreve o estado derivado, o progresso e a quantidade de cards", () => {
    expect(describeFeature(feature)).toBe("Em andamento · Progresso de 40% · 3 cards");
  });

  it("escreve um card no singular", () => {
    expect(describeFeature({ ...feature, cardCount: 1 })).toBe(
      "Em andamento · Progresso de 40% · 1 card"
    );
  });

  it.each([
    ["to_do", 0, "A fazer · Progresso de 0% · 0 cards"],
    ["done", 100, "Concluída · Progresso de 100% · 0 cards"],
  ] as const)("escreve a feature no estado %s", (state, progress, description) => {
    expect(describeFeature({ ...feature, state, progress, cardCount: 0 })).toBe(description);
  });
});

describe("describeEpic", () => {
  it("escreve o estado derivado, o progresso e as quantidades de features e de cards", () => {
    expect(describeEpic(epic)).toBe("Em andamento · Progresso de 25% · 2 features · 8 cards");
  });

  it("escreve uma feature e um card no singular, e o epic concluído no masculino", () => {
    expect(
      describeEpic({ ...epic, state: "done", progress: 100, featureCount: 1, cardCount: 1 })
    ).toBe("Concluído · Progresso de 100% · 1 feature · 1 card");
  });
});
