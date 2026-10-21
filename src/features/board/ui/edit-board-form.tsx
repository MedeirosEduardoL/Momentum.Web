import { useEditBoard } from "../model/hooks/use-edit-board";
import { hasMissingReferences } from "../model/lib/board-filter";
import type { Board, BoardFilterOptions } from "../model/types/board.types";
import { BoardForm } from "./board-form";

type EditBoardFormProps = {
  board: Board;
  options: BoardFilterOptions;
  onSaved: () => void;
};

const MISSING_REFERENCES_NOTICE =
  "O filtro guarda responsável, feature ou epic que não existe mais no projeto. Ao salvar, o que não existe mais sai do filtro.";

export function EditBoardForm({ board, options, onSaved }: EditBoardFormProps) {
  const edition = useEditBoard({ board, options, onSaved });

  return (
    <BoardForm
      {...edition}
      options={options}
      notice={hasMissingReferences(board.filter, options) ? MISSING_REFERENCES_NOTICE : undefined}
      submitLabel="Salvar board"
    />
  );
}
