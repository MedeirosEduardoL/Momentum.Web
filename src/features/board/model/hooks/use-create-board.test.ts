import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { boardKeys } from "../../api/board-api-keys";
import { createBoard } from "../../api/board.service";
import { NO_FILTER } from "../lib/board-filter";
import type { Board, BoardDefinition, BoardFilterOptions } from "../types/board.types";
import { useCreateBoard } from "./use-create-board";

vi.mock("../../api/board.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const options: BoardFilterOptions = { team: [], features: [], epics: [] };
const createdBoard: Board = {
  id: "board-9",
  projectId: "project-1",
  name: "Todos os cards",
  filter: NO_FILTER,
};
const onCreated = vi.fn<(board: Board) => void>();

function renderCreateBoard(board?: BoardDefinition) {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(
    () => useCreateBoard({ projectId: "project-1", board, options, onCreated }),
    { wrapper }
  );

  return { result, invalidateQueries };
}

async function submit(result: ReturnType<typeof renderCreateBoard>["result"], name: string) {
  await act(async () => {
    result.current.form.reset({ name, ...NO_FILTER, cardTypes: ["issue"] });
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  vi.mocked(createBoard).mockReset().mockResolvedValue(createdBoard);
  vi.mocked(toast.error).mockClear();
  onCreated.mockClear();
});

describe("useCreateBoard", () => {
  it("começa vazio, ou com o nome e o filtro dados", () => {
    expect(renderCreateBoard().result.current.form.getValues()).toEqual({ name: "", ...NO_FILTER });
    expect(
      renderCreateBoard({
        name: "Todos os cards",
        filter: NO_FILTER,
      }).result.current.form.getValues()
    ).toEqual({ name: "Todos os cards", ...NO_FILTER });
  });

  it("cria o board no projeto, recarrega a lista de boards e entrega o board criado", async () => {
    const { result, invalidateQueries } = renderCreateBoard();

    await submit(result, " Issues ");

    expect(vi.mocked(createBoard).mock.calls[0][0]).toEqual({
      projectId: "project-1",
      name: "Issues",
      filter: { ...NO_FILTER, cardTypes: ["issue"] },
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: boardKeys.lists() });
    expect(onCreated).toHaveBeenCalledWith(createdBoard);
  });

  it("recarrega tudo quando o Core recusa, porque a tela está velha", async () => {
    vi.mocked(createBoard).mockRejectedValue(
      apiError(403, "BoardAdministrationDenied", "Só o administrador do projeto cria boards.")
    );
    const { result, invalidateQueries } = renderCreateBoard();

    await submit(result, "Issues");

    expect(invalidateQueries).toHaveBeenCalledWith();
    expect(toast.error).toHaveBeenCalledWith("Só o administrador do projeto cria boards.");
    expect(onCreated).not.toHaveBeenCalled();
  });
});
