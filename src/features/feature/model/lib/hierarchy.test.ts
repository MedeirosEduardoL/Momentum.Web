import { describe, expect, it } from "vitest";
import type { EpicSummary, FeatureSummary } from "../types/feature.types";
import { isEmptyHierarchy, listEpicFeatures, toHierarchy } from "./hierarchy";

function epic(id: string): EpicSummary {
  return {
    id,
    projectId: "project-1",
    title: `Epic ${id}`,
    progress: 0,
    state: "to_do",
    featureCount: 0,
    cardCount: 0,
  };
}

function feature(id: string, epicId: string | null): FeatureSummary {
  return {
    id,
    projectId: "project-1",
    epicId,
    title: `Feature ${id}`,
    progress: 0,
    state: "to_do",
    cardCount: 0,
  };
}

const lists = epic("epic-lists");
const board = epic("epic-board");
const filters = feature("filters", "epic-lists");
const pagination = feature("pagination", "epic-lists");
const columns = feature("columns", "epic-board");
const loose = feature("loose", null);

describe("toHierarchy", () => {
  it("põe cada feature no epic dela, na ordem em que os epics e as features chegaram", () => {
    expect(toHierarchy([lists, board], [filters, columns, loose, pagination])).toEqual({
      epics: [
        { epic: lists, features: [filters, pagination] },
        { epic: board, features: [columns] },
      ],
      featuresWithoutEpic: [loose],
    });
  });

  it("mantém o epic que ainda não tem feature", () => {
    expect(toHierarchy([lists], [loose])).toEqual({
      epics: [{ epic: lists, features: [] }],
      featuresWithoutEpic: [loose],
    });
  });

  it("não esconde a feature cujo epic não veio na lista de epics", () => {
    const orphan = feature("orphan", "epic-deleted");

    expect(toHierarchy([lists], [orphan]).featuresWithoutEpic).toEqual([orphan]);
  });
});

describe("listEpicFeatures", () => {
  it("devolve só as features do epic", () => {
    expect(listEpicFeatures([filters, columns, loose, pagination], "epic-lists")).toEqual([
      filters,
      pagination,
    ]);
  });
});

describe("isEmptyHierarchy", () => {
  it("reconhece o projeto sem epic nem feature", () => {
    expect(isEmptyHierarchy(toHierarchy([], []))).toBe(true);
  });

  it.each([
    ["só epic", [lists], []],
    ["só feature sem epic", [], [loose]],
  ])("não trata como vazio o projeto com %s", (_case, epics, features) => {
    expect(isEmptyHierarchy(toHierarchy(epics, features))).toBe(false);
  });
});
