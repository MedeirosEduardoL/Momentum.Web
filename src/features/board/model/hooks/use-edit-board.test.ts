import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { boardKeys } from "../../api/board-api-keys";
import { updateBoard } from "../../api/board.service";
import type { Board, BoardFilterOptions } from "../types/board.types";
import { useEditBoard } from "./use-edit-board";

vi.mock("../../api/board.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const options: BoardFilterOptions = {
  team: [{ userId: "user-1", name: "Ana Souza", email: "ana@exemplo.test", role: "member" }],
  features: [],
  epics: [],
};
const board: Board = {
  id: "board-1",
  projectId: "project-1",
  name: "Cards da Ana",
  filter: {
    cardTypes: [],
    priorities: ["high"],
    assigneeIds: ["user-1", "user-9"],
    featureIds: ["feature-9"],
    epicIds: [],
  },
};
const onSaved = vi.fn();

function renderEditBoard() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useEditBoard({ board, options, onSaved }), { wrapper });

  return { result, invalidateQueries };
}

beforeEach(() => {
  vi.mocked(updateBoard).mockReset().mockResolvedValue(board);
  vi.mocked(toast.error).mockClear();
  onSaved.mockClear();
});

describe("useEditBoard", () => {
  it("começa com o nome e o filtro do board", () => {
    const { result } = renderEditBoard();

    expect(result.current.form.getValues()).toEqual({ name: "Cards da Ana", ...board.filter });
  });

  it("grava o nome e o filtro inteiro, sem o que não existe mais no projeto", async () => {
    const { result, invalidateQueries } = renderEditBoard();

    await act(async () => {
      result.current.form.setValue("name", "Cards da Ana Souza");
      await result.current.onSubmit();
    });

    expect(vi.mocked(updateBoard).mock.calls[0][0]).toEqual({
      boardId: "board-1",
      name: "Cards da Ana Souza",
      filter: {
        cardTypes: [],
        priorities: ["high"],
        assigneeIds: ["user-1"],
        featureIds: [],
        epicIds: [],
      },
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: boardKeys.all });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("avisa e recarrega tudo quando o board foi excluído por outra pessoa", async () => {
    vi.mocked(updateBoard).mockRejectedValue(
      apiError(404, "BoardNotFound", "Board não encontrado.")
    );
    const { result, invalidateQueries } = renderEditBoard();

    await act(() => result.current.onSubmit());

    expect(toast.error).toHaveBeenCalledWith("Board não encontrado.");
    expect(invalidateQueries).toHaveBeenCalledWith();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
