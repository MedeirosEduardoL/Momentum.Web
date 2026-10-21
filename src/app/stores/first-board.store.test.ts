import { beforeEach, describe, expect, it } from "vitest";
import type { Project } from "@/features/project";
import { useFirstBoardStore } from "./first-board.store";

const project: Project = { id: "project-1", name: "Momentum", key: "MOM", role: "administrator" };

beforeEach(() => {
  useFirstBoardStore.getState().clearPending();
});

describe("useFirstBoardStore", () => {
  it("começa sem projeto à espera do primeiro board", () => {
    expect(useFirstBoardStore.getState().pendingProject).toBeNull();
  });

  it("guarda o projeto que acabou de ser criado sem board", () => {
    useFirstBoardStore.getState().markPending(project);

    expect(useFirstBoardStore.getState().pendingProject).toEqual(project);
  });

  it("esquece o projeto quando o diálogo termina", () => {
    useFirstBoardStore.getState().markPending(project);

    useFirstBoardStore.getState().clearPending();

    expect(useFirstBoardStore.getState().pendingProject).toBeNull();
  });

  it("vive só na memória da página, sem persistência que a traga de volta ao recarregar", () => {
    expect(useFirstBoardStore).not.toHaveProperty("persist");
  });
});
