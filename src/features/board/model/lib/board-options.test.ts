import { describe, expect, it } from "vitest";
import { NO_FILTER } from "./board-filter";
import {
  ANY_ASSIGNEE_OPTION,
  BOARD_GROUPING_OPTIONS,
  fromAssigneeChoice,
  toAssigneeChoice,
  toBoardOptions,
  toEpicOptions,
  UNASSIGNED_OPTION,
} from "./board-options";

describe("opções do board", () => {
  it("oferece os boards do projeto pelo nome, na ordem recebida", () => {
    expect(
      toBoardOptions([
        { id: "board-1", projectId: "project-1", name: "Todos os cards", filter: NO_FILTER },
        { id: "board-2", projectId: "project-1", name: "Issues", filter: NO_FILTER },
      ])
    ).toEqual([
      { value: "board-1", label: "Todos os cards" },
      { value: "board-2", label: "Issues" },
    ]);
  });

  it("oferece os epics pelo título", () => {
    expect(
      toEpicOptions([
        {
          id: "epic-1",
          projectId: "project-1",
          title: "Lista de cards",
          progress: 25,
          state: "in_progress",
          featureCount: 1,
          cardCount: 3,
        },
      ])
    ).toEqual([{ value: "epic-1", label: "Lista de cards" }]);
  });

  it("começa a visão por responsável em todos", () => {
    expect(ANY_ASSIGNEE_OPTION).toEqual({ value: "", label: "Todos" });
  });

  it("oferece só os cards sem responsável, com um valor que não é identificador de pessoa", () => {
    expect(UNASSIGNED_OPTION).toEqual({ value: "unassigned", label: "Sem responsável" });
  });

  it("oferece o board sem agrupar ou agrupado por responsável", () => {
    expect(BOARD_GROUPING_OPTIONS).toEqual([
      { value: "none", label: "Sem agrupar" },
      { value: "assignee", label: "Responsável" },
    ]);
  });
});

describe("escolha do responsável no board", () => {
  it("mostra a escolha que a visão tem: todos, sem responsável ou uma pessoa", () => {
    expect(toAssigneeChoice({})).toBe("");
    expect(toAssigneeChoice({ isUnassigned: true })).toBe("unassigned");
    expect(toAssigneeChoice({ assigneeId: "user-1" })).toBe("user-1");
  });

  it("leva cada escolha para a visão, sem misturar pessoa e sem responsável", () => {
    expect(fromAssigneeChoice("")).toEqual({ assigneeId: undefined, isUnassigned: undefined });
    expect(fromAssigneeChoice("unassigned")).toEqual({
      assigneeId: undefined,
      isUnassigned: true,
    });
    expect(fromAssigneeChoice("user-1")).toEqual({ assigneeId: "user-1", isUnassigned: undefined });
  });
});
