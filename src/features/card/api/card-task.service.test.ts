import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import {
  createCardTask,
  deleteCardTask,
  listCardTasks,
  setCardTaskAssignee,
  updateCardTask,
} from "./card-task.service";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const taskDto = {
  card_task_id: "task-1",
  card_id: "card-1",
  kind: "task",
  title: "Escrever o teste do filtro",
  description: "Cobrir o filtro por **cliente**.",
  state: "in_progress",
  assignee: { user_id: "user-1", name: "Ana Souza" },
  created_at: "2026-10-12T09:00:00Z",
  updated_at: "2026-10-13T12:00:00Z",
};

const task = {
  id: "task-1",
  cardId: "card-1",
  kind: "task",
  title: "Escrever o teste do filtro",
  description: "Cobrir o filtro por **cliente**.",
  state: "in_progress",
  assignee: { userId: "user-1", name: "Ana Souza" },
  updatedAt: "2026-10-13T12:00:00Z",
};

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: taskDto });
  vi.mocked(api.patch).mockReset().mockResolvedValue({ data: taskDto });
  vi.mocked(api.put).mockReset().mockResolvedValue({ data: null });
  vi.mocked(api.delete).mockReset().mockResolvedValue({ data: null });
});

describe("listCardTasks", () => {
  it("lista as tasks do card na ordem que o Core devolve, adaptadas do contrato", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [taskDto, { ...taskDto, card_task_id: "task-2", state: "to_do", assignee: null }],
    });

    await expect(listCardTasks("card-1")).resolves.toEqual([
      task,
      { ...task, id: "task-2", state: "to_do", assignee: null },
    ]);
    expect(api.get).toHaveBeenCalledWith("/api/v1/cards/card-1/tasks");
  });
});

describe("createCardTask", () => {
  it("cria o subitem no card, com o tipo e o responsável escolhidos", async () => {
    await expect(
      createCardTask({
        cardId: "card-1",
        kind: "task",
        title: "Escrever o teste do filtro",
        assigneeId: "user-1",
      })
    ).resolves.toEqual(task);

    expect(api.post).toHaveBeenCalledWith("/api/v1/cards/card-1/tasks", {
      kind: "task",
      title: "Escrever o teste do filtro",
      assignee_id: "user-1",
    });
  });

  it("cria o bug sem responsável", async () => {
    await createCardTask({
      cardId: "card-1",
      kind: "bug",
      title: "Filtro ignora acento",
      assigneeId: null,
    });

    expect(vi.mocked(api.post).mock.calls[0][1]).toEqual({
      kind: "bug",
      title: "Filtro ignora acento",
      assignee_id: null,
    });
  });
});

describe("updateCardTask", () => {
  it("manda só o estado quando a task muda de estado", async () => {
    await expect(updateCardTask({ cardTaskId: "task-1", state: "done" })).resolves.toEqual(task);

    expect(api.patch).toHaveBeenCalledWith("/api/v1/card-tasks/task-1", { state: "done" });
  });

  it("manda o título, a descrição e a versão lida quando o subitem é editado", async () => {
    await updateCardTask({
      cardTaskId: "task-1",
      title: "Escrever os testes",
      description: "Com acento.",
      expectedUpdatedAt: "2026-10-13T12:00:00Z",
    });

    expect(api.patch).toHaveBeenCalledWith("/api/v1/card-tasks/task-1", {
      title: "Escrever os testes",
      description: "Com acento.",
      expected_updated_at: "2026-10-13T12:00:00Z",
    });
  });
});

describe("deleteCardTask", () => {
  it("exclui a task pelo id", async () => {
    await deleteCardTask("task-1");

    expect(api.delete).toHaveBeenCalledWith("/api/v1/card-tasks/task-1");
  });
});

describe("setCardTaskAssignee", () => {
  it("define o responsável da task pela rota própria", async () => {
    await setCardTaskAssignee({ cardTaskId: "task-1", userId: "user-2" });

    expect(api.put).toHaveBeenCalledWith("/api/v1/card-tasks/task-1/assignee", {
      user_id: "user-2",
    });
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("tira o responsável da task pela rota de exclusão", async () => {
    await setCardTaskAssignee({ cardTaskId: "task-1", userId: null });

    expect(api.delete).toHaveBeenCalledWith("/api/v1/card-tasks/task-1/assignee");
    expect(api.put).not.toHaveBeenCalled();
  });
});
