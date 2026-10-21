import { describe, expect, it } from "vitest";
import type { EpicSummary } from "../types/feature.types";
import { NO_EPIC_OPTION, toEpicOptions } from "./epic-options";

const epic: EpicSummary = {
  id: "epic-1",
  projectId: "project-1",
  title: "Lista de cards",
  progress: 0,
  state: "to_do",
  featureCount: 0,
  cardCount: 0,
};

describe("toEpicOptions", () => {
  it("oferece cada epic pelo título, na ordem recebida", () => {
    expect(toEpicOptions([epic, { ...epic, id: "epic-2", title: "Board" }])).toEqual([
      { value: "epic-1", label: "Lista de cards" },
      { value: "epic-2", label: "Board" },
    ]);
  });
});

describe("NO_EPIC_OPTION", () => {
  it("é a opção de valor vazio", () => {
    expect(NO_EPIC_OPTION).toEqual({ value: "", label: "Sem epic" });
  });
});
