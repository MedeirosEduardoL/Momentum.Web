import { useUpdateBoardMutation } from "../../api/board.mutations";
import type { Board, BoardFilterOptions } from "../types/board.types";
import { useBoardForm } from "./use-board-form";

type EditBoardOptions = {
  board: Board;
  options: BoardFilterOptions;
  onSaved: () => void;
};

export function useEditBoard({ board, options, onSaved }: EditBoardOptions) {
  const updateBoard = useUpdateBoardMutation();

  return useBoardForm({
    board,
    options,
    save: definition => updateBoard.mutateAsync({ boardId: board.id, ...definition }),
    isSaving: updateBoard.isPending,
    onSaved,
  });
}
