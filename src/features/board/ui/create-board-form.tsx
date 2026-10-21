import { useCreateBoard } from "../model/hooks/use-create-board";
import type { Board, BoardDefinition, BoardFilterOptions } from "../model/types/board.types";
import { BoardForm } from "./board-form";

type CreateBoardFormProps = {
  projectId: string;
  board?: BoardDefinition;
  options: BoardFilterOptions;
  onCreated: (board: Board) => void;
};

export function CreateBoardForm({ projectId, board, options, onCreated }: CreateBoardFormProps) {
  const creation = useCreateBoard({ projectId, board, options, onCreated });

  return <BoardForm {...creation} options={options} submitLabel="Criar board" />;
}
