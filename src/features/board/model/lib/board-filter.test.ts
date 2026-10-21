import { describe, expect, it } from "vitest";
import type { BoardFilter, BoardFilterOptions } from "../types/board.types";
import { hasMissingReferences, keepExistingReferences, NO_FILTER } from "./board-filter";

const options: BoardFilterOptions = {
  team: [
    { userId: "user-1", name: "Ana Souza", email: "ana@exemplo.test", role: "administrator" },
    { userId: "user-2", name: "Bruno Lima", email: "bruno@exemplo.test", role: "member" },
  ],
  features: [
    {
      id: "feature-1",
      projectId: "project-1",
      epicId: "epic-1",
      title: "Filtros da lista",
      progress: 40,
      state: "in_progress",
      cardCount: 3,
    },
  ],
  epics: [
    {
      id: "epic-1",
      projectId: "project-1",
      title: "Lista de cards",
      progress: 25,
      state: "in_progress",
      featureCount: 1,
      cardCount: 3,
    },
  ],
};

const filter: BoardFilter = {
  cardTypes: ["issue", "spike"],
  priorities: ["urgent"],
  assigneeIds: ["user-2", "user-1"],
  featureIds: ["feature-1"],
  epicIds: ["epic-1"],
};

describe("NO_FILTER", () => {
  it("é o filtro que não filtra: os cinco critérios vazios", () => {
    expect(NO_FILTER).toEqual({
      cardTypes: [],
      priorities: [],
      assigneeIds: [],
      featureIds: [],
      epicIds: [],
    });
  });
});

describe("keepExistingReferences", () => {
  it("mantém o filtro cujos responsáveis, features e epics existem no projeto", () => {
    expect(keepExistingReferences(filter, options)).toEqual(filter);
  });

  it("tira quem saiu do time, a feature excluída e o epic excluído", () => {
    const stale: BoardFilter = {
      ...filter,
      assigneeIds: ["user-9", "user-1"],
      featureIds: ["feature-9"],
      epicIds: ["epic-1", "epic-9"],
    };

    expect(keepExistingReferences(stale, options)).toEqual({
      ...filter,
      assigneeIds: ["user-1"],
      featureIds: [],
      epicIds: ["epic-1"],
    });
  });

  it("não mexe nos tipos de card nem nas prioridades", () => {
    const noOptions: BoardFilterOptions = { team: [], features: [], epics: [] };

    expect(keepExistingReferences(filter, noOptions)).toEqual({
      cardTypes: ["issue", "spike"],
      priorities: ["urgent"],
      assigneeIds: [],
      featureIds: [],
      epicIds: [],
    });
  });
});

describe("hasMissingReferences", () => {
  it("diz que o filtro está em dia quando tudo o que ele guarda existe", () => {
    expect(hasMissingReferences(filter, options)).toBe(false);
    expect(hasMissingReferences(NO_FILTER, options)).toBe(false);
  });

  it.each([
    ["responsável que saiu do time", { assigneeIds: ["user-9"] }],
    ["feature excluída", { featureIds: ["feature-1", "feature-9"] }],
    ["epic excluído", { epicIds: ["epic-9"] }],
  ])("percebe o filtro que guarda %s", (_case, staleCriterion) => {
    expect(hasMissingReferences({ ...filter, ...staleCriterion }, options)).toBe(true);
  });
});
