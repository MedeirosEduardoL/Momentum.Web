import { describe, expect, it } from "vitest";
import type { EpicSummary, FeatureSummary } from "@/features/feature";
import { findCardFeaturePlace } from "./card-feature-place";

const epic: EpicSummary = {
  id: "epic-1",
  projectId: "project-1",
  title: "Lista de cards",
  progress: 25,
  state: "in_progress",
  featureCount: 1,
  cardCount: 3,
};

const featureInEpic: FeatureSummary = {
  id: "feature-1",
  projectId: "project-1",
  epicId: "epic-1",
  title: "Filtros da lista",
  progress: 40,
  state: "in_progress",
  cardCount: 3,
};

const looseFeature: FeatureSummary = { ...featureInEpic, id: "feature-2", epicId: null };

describe("findCardFeaturePlace", () => {
  it("acha a feature do card e o epic dela", () => {
    expect(findCardFeaturePlace([looseFeature, featureInEpic], [epic], "feature-1")).toEqual({
      feature: featureInEpic,
      epic,
    });
  });

  it("devolve a feature sem epic quando ela não está em nenhum", () => {
    expect(findCardFeaturePlace([looseFeature], [epic], "feature-2")).toEqual({
      feature: looseFeature,
      epic: null,
    });
  });

  it("devolve a feature sem epic quando o epic dela não veio na lista", () => {
    expect(findCardFeaturePlace([featureInEpic], [], "feature-1")).toEqual({
      feature: featureInEpic,
      epic: null,
    });
  });

  it.each(["", "feature-9"])("não acha lugar para a feature %j", featureId => {
    expect(findCardFeaturePlace([featureInEpic], [epic], featureId)).toBeNull();
  });
});
