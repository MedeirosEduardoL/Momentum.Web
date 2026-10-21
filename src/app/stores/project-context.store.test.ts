import { describe, expect, it } from "vitest";
import { useProjectContextStore } from "./project-context.store";

describe("useProjectContextStore", () => {
  it("lembra o último projeto informado pela tela, sem persistência", () => {
    useProjectContextStore.getState().setProjectId("project-1");
    useProjectContextStore.getState().setProjectId("project-2");

    expect(useProjectContextStore.getState().projectId).toBe("project-2");
    expect(useProjectContextStore).not.toHaveProperty("persist");
  });
});
