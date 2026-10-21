import { describe, expect, it } from "vitest";
import { fromAssigneeSearch, toAssigneeSearch } from "./assignee-search";

describe("assignee-search", () => {
  it("escreve o sem responsável como nenhum e a pessoa pelo id", () => {
    expect(toAssigneeSearch({ isUnassigned: true })).toBe("nenhum");
    expect(toAssigneeSearch({ assigneeId: "user-1" })).toBe("user-1");
    expect(toAssigneeSearch({})).toBeUndefined();
  });

  it("lê o nenhum como sem responsável e o resto como a pessoa", () => {
    expect(fromAssigneeSearch("nenhum")).toEqual({ assigneeId: undefined, isUnassigned: true });
    expect(fromAssigneeSearch("user-1")).toEqual({ assigneeId: "user-1", isUnassigned: undefined });
    expect(fromAssigneeSearch(undefined)).toEqual({
      assigneeId: undefined,
      isUnassigned: undefined,
    });
  });
});
