import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import {
  createBoard,
  deleteBoard,
  listBoardColumns,
  listBoards,
  updateBoard,
} from "./board.service";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const boardDto = {
  board_id: "board-1",
  project_id: "project-1",
  name: "Issues urgentes",
  filter: {
    card_types: ["issue"],
    priorities: ["urgent", "high"],
    assignee_ids: ["user-1"],
    feature_ids: ["feature-1"],
    epic_ids: ["epic-1"],
  },
  created_at: "2026-10-12T09:00:00Z",
  updated_at: "2026-10-13T12:00:00Z",
};

const filter = {
  cardTypes: ["issue" as const],
  priorities: ["urgent" as const, "high" as const],
  assigneeIds: ["user-1"],
  featureIds: ["feature-1"],
  epicIds: ["epic-1"],
};

const board = { id: "board-1", projectId: "project-1", name: "Issues urgentes", filter };

const stateDto = {
  card_state_id: "state-2",
  name: "Em andamento",
  category: "in_progress",
  position: 2,
};

const columnDto = {
  state: stateDto,
  total_count: 250,
  cards: [
    {
      card_id: "card-1",
      project_id: "project-1",
      identifier: "MOM-12",
      card_type: "issue",
      title: "Lista de chamados vazia",
      state: stateDto,
      priority: "urgent",
      assignee: { user_id: "user-1", name: "Ana Souza" },
      feature_id: "feature-1",
      progress: 40,
      task_count: 5,
      done_task_count: 2,
      subitem_counts: {
        task: { total_count: 0, done_count: 0 },
        bug: { total_count: 0, done_count: 0 },
        impediment: { total_count: 0, done_count: 0 },
      },
      archived: false,
      updated_at: "2026-10-13T12:00:00Z",
    },
  ],
};

const state = { id: "state-2", name: "Em andamento", category: "in_progress", position: 2 };

const column = {
  state,
  totalCount: 250,
  cards: [
    {
      id: "card-1",
      projectId: "project-1",
      identifier: "MOM-12",
      type: "issue",
      title: "Lista de chamados vazia",
      state,
      priority: "urgent",
      assignee: { userId: "user-1", name: "Ana Souza" },
      featureId: "feature-1",
      progress: 40,
      taskCount: 5,
      doneTaskCount: 2,
      subitemCounts: {
        task: { total: 0, done: 0 },
        bug: { total: 0, done: 0 },
        impediment: { total: 0, done: 0 },
      },
      isArchived: false,
      updatedAt: "2026-10-13T12:00:00Z",
    },
  ],
};

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: boardDto });
  vi.mocked(api.patch).mockReset().mockResolvedValue({ data: boardDto });
  vi.mocked(api.delete).mockReset().mockResolvedValue({ data: null });
});

describe("listBoards", () => {
  it("lista os boards do projeto, cada um com o filtro adaptado do contrato", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [boardDto] });

    await expect(listBoards("project-1")).resolves.toEqual([board]);
    expect(api.get).toHaveBeenCalledWith("/api/v1/boards", {
      params: { project_id: "project-1" },
    });
  });

  it("devolve a lista vazia do projeto que ainda não tem board", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await expect(listBoards("project-1")).resolves.toEqual([]);
  });
});

describe("createBoard", () => {
  it("cria o board no projeto, com o nome e os cinco critérios do filtro", async () => {
    await expect(
      createBoard({ projectId: "project-1", name: "Issues urgentes", filter })
    ).resolves.toEqual(board);

    expect(api.post).toHaveBeenCalledWith("/api/v1/boards", {
      project_id: "project-1",
      name: "Issues urgentes",
      filter: boardDto.filter,
    });
  });

  it("manda os critérios vazios do board que não filtra", async () => {
    await createBoard({
      projectId: "project-1",
      name: "Todos os cards",
      filter: { cardTypes: [], priorities: [], assigneeIds: [], featureIds: [], epicIds: [] },
    });

    expect(vi.mocked(api.post).mock.calls[0][1]).toMatchObject({
      filter: { card_types: [], priorities: [], assignee_ids: [], feature_ids: [], epic_ids: [] },
    });
  });
});

describe("updateBoard", () => {
  it("grava o nome e o filtro inteiro do board", async () => {
    await expect(
      updateBoard({ boardId: "board-1", name: "Issues urgentes", filter })
    ).resolves.toEqual(board);

    expect(api.patch).toHaveBeenCalledWith("/api/v1/boards/board-1", {
      name: "Issues urgentes",
      filter: boardDto.filter,
    });
  });
});

describe("deleteBoard", () => {
  it("exclui o board", async () => {
    await deleteBoard("board-1");

    expect(api.delete).toHaveBeenCalledWith("/api/v1/boards/board-1");
  });
});

describe("listBoardColumns", () => {
  it("lê as colunas do board, com o estado, o total e os cards adaptados do contrato", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [columnDto] });

    await expect(listBoardColumns({ boardId: "board-1" })).resolves.toEqual([column]);
    expect(api.get).toHaveBeenCalledWith("/api/v1/boards/board-1/columns", {
      params: { assignee_id: undefined },
    });
  });

  it("filtra as colunas pelo responsável escolhido", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await listBoardColumns({ boardId: "board-1", assigneeId: "user-1" });

    expect(vi.mocked(api.get).mock.calls[0][1]).toStrictEqual({
      params: { assignee_id: "user-1", unassigned: undefined },
    });
  });

  it("pede só os cards sem responsável", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await listBoardColumns({ boardId: "board-1", isUnassigned: true });

    expect(api.get).toHaveBeenCalledWith("/api/v1/boards/board-1/columns", {
      params: { assignee_id: undefined, unassigned: true },
    });
  });

  it("mantém a coluna do estado que não tem card", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [{ state: stateDto, total_count: 0, cards: [] }],
    });

    await expect(listBoardColumns({ boardId: "board-1" })).resolves.toEqual([
      { state, totalCount: 0, cards: [] },
    ]);
  });
});
