import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListProjectMembers } from "@/features/project";
import { createQueryWrapper } from "@/test/query-wrapper";
import { listCards, listCardStates } from "../api/card.service";
import type { CardSummary } from "../model/types/card.types";
import { BoardCardList } from "./board-card-list";

vi.mock("../api/card.service");
vi.mock("@/features/feature", () => ({
  useListFeatures: () => ({ data: [], isPending: false, isError: false }),
}));
vi.mock("@/features/project", () => ({ useListProjectMembers: vi.fn() }));

const card: CardSummary = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "issue",
  title: "Lista vazia depois do login",
  state: { id: "state-1", name: "Novo", category: "to_do", position: 1 },
  priority: "medium",
  assignee: null,
  featureId: null,
  progress: 0,
  taskCount: 0,
  doneTaskCount: 0,
  subitemCounts: {
    task: { total: 0, done: 0 },
    bug: { total: 0, done: 0 },
    impediment: { total: 0, done: 0 },
  },
  isArchived: false,
  updatedAt: "2026-10-22T10:00:00Z",
};

beforeEach(() => {
  vi.mocked(listCards)
    .mockReset()
    .mockResolvedValue({ cards: [card], page: 1, totalPages: 1 });
  vi.mocked(listCardStates).mockReset().mockResolvedValue([card.state]);
  vi.mocked(useListProjectMembers).mockReturnValue({
    data: [],
    isPending: false,
    isError: false,
    isSuccess: true,
  } as unknown as ReturnType<typeof useListProjectMembers>);
});

describe("BoardCardList", () => {
  it("lista os cards do board com os filtros da lista, sem repetir o responsável da barra do board", async () => {
    render(
      <BoardCardList
        boardId="board-1"
        projectId="project-1"
        filters={{ assigneeId: "user-1", stateId: "state-1", includesArchived: false, page: 1 }}
        onFiltersChange={vi.fn()}
        renderCardLink={shown => <a href={`/cards/${shown.id}`}>{shown.title}</a>}
      />,
      { wrapper: createQueryWrapper().wrapper }
    );

    expect(await screen.findByRole("link", { name: "Lista vazia depois do login" })).toBeVisible();
    expect(listCards).toHaveBeenCalledWith({
      boardId: "board-1",
      assigneeId: "user-1",
      stateId: "state-1",
      includesArchived: false,
      page: 1,
    });
    expect(screen.getByRole("combobox", { name: "Estado" })).toHaveValue("state-1");
    expect(screen.queryByRole("combobox", { name: "Responsável" })).toBeNull();
  });
});
