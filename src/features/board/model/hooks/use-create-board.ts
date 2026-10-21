import { useCreateBoardMutation } from "../../api/board.mutations";
import type { Board, BoardDefinition, BoardFilterOptions } from "../types/board.types";
import { useBoardForm } from "./use-board-form";

type CreateBoardOptions = {
  projectId: string;
  board?: BoardDefinition;
  options: BoardFilterOptions;
  onCreated: (board: Board) => void;
};

export function useCreateBoard({ projectId, board, options, onCreated }: CreateBoardOptions) {
  const createBoard = useCreateBoardMutation();

  return useBoardForm({
    board,
    options,
    save: definition => createBoard.mutateAsync({ projectId, ...definition }),
    isSaving: createBoard.isPending,
    onSaved: onCreated,
  });
}
