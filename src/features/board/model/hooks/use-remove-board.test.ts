import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { boardKeys } from "../../api/board-api-keys";
import { deleteBoard } from "../../api/board.service";
import { NO_FILTER } from "../lib/board-filter";
import type { Board } from "../types/board.types";
import { useRemoveBoard } from "./use-remove-board";

vi.mock("../../api/board.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const board: Board = {
  id: "board-1",
  projectId: "project-1",
  visibility: "team",
  name: "Issues",
  filter: NO_FILTER,
};
const COLUMNS_KEY = boardKeys.columns({ boardId: "board-1" });
const onRemoved = vi.fn();

function renderRemoval() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useRemoveBoard(onRemoved), { wrapper });

  return { result, queryClient, invalidateQueries };
}

beforeEach(() => {
  vi.mocked(deleteBoard).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
  onRemoved.mockClear();
});

describe("useRemoveBoard", () => {
  it("exclui o board, confirma na tela e avisa quem chamou", async () => {
    const { result } = renderRemoval();

    await act(() => result.current(board));

    expect(vi.mocked(deleteBoard).mock.calls[0][0]).toBe("board-1");
    expect(toast.success).toHaveBeenCalledWith("O board Issues foi excluído.");
    expect(onRemoved).toHaveBeenCalledTimes(1);
  });

  it("recarrega só as listas de boards, sem pedir as colunas do board que sumiu", async () => {
    const { result, queryClient, invalidateQueries } = renderRemoval();
    queryClient.setQueryData(COLUMNS_KEY, []);

    await act(() => result.current(board));

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: boardKeys.lists() });
    expect(queryClient.getQueryState(COLUMNS_KEY)?.isInvalidated).toBe(false);
  });

  it("mostra a mensagem do Core, recarrega tudo e não avisa quem chamou quando a exclusão falha", async () => {
    vi.mocked(deleteBoard).mockRejectedValue(
      apiError(403, "BoardAdministrationDenied", "Só o administrador do projeto exclui boards.")
    );
    const { result, invalidateQueries } = renderRemoval();

    await act(() => result.current(board));

    expect(toast.error).toHaveBeenCalledWith("Só o administrador do projeto exclui boards.");
    expect(toast.success).not.toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith();
    expect(onRemoved).not.toHaveBeenCalled();
  });
});
