import { describe, expect, it } from "vitest";
import { toGroupColumns } from "./group-board";

describe("toGroupColumns", () => {
  it("separa as features nas três colunas do estado derivado, na ordem do fluxo, inclusive as vazias", () => {
    const columns = toGroupColumns([
      { id: "f-1", state: "done" as const },
      { id: "f-2", state: "to_do" as const },
      { id: "f-3", state: "done" as const },
    ]);

    expect(columns.map(column => [column.state, column.groups.map(group => group.id)])).toEqual([
      ["to_do", ["f-2"]],
      ["in_progress", []],
      ["done", ["f-1", "f-3"]],
    ]);
  });
});
