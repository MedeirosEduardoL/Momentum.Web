import { describe, expect, it } from "vitest";
import { apiError, networkFailure } from "@/test/api-errors";
import {
  isAssigneeOutsideProject,
  isFeatureOutsideProject,
  wasCardChangedMeanwhile,
} from "./card-refusal";

describe("isFeatureOutsideProject", () => {
  it("reconhece a feature que não existe no projeto do card", () => {
    const featureInvalid = apiError(
      422,
      "CardFeatureInvalid",
      "Esta feature não existe no projeto do card.",
      { property: "featureId" }
    );

    expect(isFeatureOutsideProject(featureInvalid)).toBe(true);
  });

  it.each([networkFailure, new Error("falha")])("não confunde com outra falha", error => {
    expect(isFeatureOutsideProject(error)).toBe(false);
  });
});

const changedMeanwhile = apiError(
  409,
  "CardChangedMeanwhile",
  "O card foi alterado por outra pessoa enquanto você editava. Recarregue e tente de novo."
);
const assigneeOutsideProject = apiError(
  422,
  "CardAssigneeOutsideProject",
  "O responsável precisa fazer parte do time do projeto.",
  { property: "assigneeId" }
);

describe("wasCardChangedMeanwhile", () => {
  it("reconhece a gravação recusada porque outra pessoa alterou o card", () => {
    expect(wasCardChangedMeanwhile(changedMeanwhile)).toBe(true);
  });

  it.each([assigneeOutsideProject, networkFailure, new Error("falha")])(
    "não confunde com outra falha",
    error => {
      expect(wasCardChangedMeanwhile(error)).toBe(false);
    }
  );
});

describe("isAssigneeOutsideProject", () => {
  it("reconhece o responsável que não está no time do projeto", () => {
    expect(isAssigneeOutsideProject(assigneeOutsideProject)).toBe(true);
  });

  it.each([changedMeanwhile, networkFailure, new Error("falha")])(
    "não confunde com outra falha",
    error => {
      expect(isAssigneeOutsideProject(error)).toBe(false);
    }
  );
});
