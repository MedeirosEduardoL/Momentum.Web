import { Columns3, Pencil, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ActionMenu } from "@/shared/ui/action-menu";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Modal } from "@/shared/ui/modal";
import { useConfirmation } from "@/shared/ui/use-confirmation";
import { useRemoveBoard } from "../model/hooks/use-remove-board";
import type { Board, BoardColumns, BoardView } from "../model/types/board.types";
import { BoardColumnsContent } from "./board-columns-content";
import { BoardFilterOptionsContent } from "./board-filter-options-content";
import { BoardToolbar } from "./board-toolbar";
import { EditBoardForm } from "./edit-board-form";

type SelectedBoardProps = {
  boards: Board[];
  board: Board;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
  canAdminister: boolean;
  onRemoving: (board: Board) => void;
  renderColumns: (columns: BoardColumns) => ReactNode;
  columnsEditor: ReactNode;
};

export function SelectedBoard({
  boards,
  board,
  view,
  onViewChange,
  canAdminister,
  onRemoving,
  renderColumns,
  columnsEditor,
}: SelectedBoardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingColumns, setIsEditingColumns] = useState(false);
  const removeBoard = useRemoveBoard(() => onViewChange({ ...view, boardId: undefined }));
  const removal = useConfirmation(() => {
    onRemoving(board);
    return removeBoard(board);
  });

  return (
    <>
      <BoardToolbar
        boards={boards}
        board={board}
        view={view}
        onViewChange={onViewChange}
        actions={
          canAdminister && (
            <ActionMenu
              label={`Ações do board ${board.name}`}
              items={[
                {
                  label: "Editar board",
                  icon: <Pencil aria-hidden />,
                  onSelect: () => setIsEditing(true),
                },
                {
                  label: "Editar colunas",
                  icon: <Columns3 aria-hidden />,
                  onSelect: () => setIsEditingColumns(true),
                },
                {
                  label: "Excluir",
                  icon: <Trash2 aria-hidden />,
                  isDestructive: true,
                  onSelect: removal.open,
                },
              ]}
            />
          )
        }
      />
      <BoardColumnsContent
        query={{
          boardId: board.id,
          assigneeId: view.assigneeId,
          isUnassigned: view.isUnassigned,
        }}
        savedFilter={board.filter}
        renderColumns={renderColumns}
      />
      <Modal
        open={isEditing}
        onOpenChange={setIsEditing}
        title="Editar board"
        description="O nome e o filtro que decide quais cards do projeto aparecem neste board."
      >
        <BoardFilterOptionsContent projectId={board.projectId}>
          {options => (
            <EditBoardForm board={board} options={options} onSaved={() => setIsEditing(false)} />
          )}
        </BoardFilterOptionsContent>
      </Modal>
      <Modal
        open={isEditingColumns}
        size="lg"
        onOpenChange={setIsEditingColumns}
        title="Editar colunas"
        description="Cada coluna é um estado do projeto, na ordem do fluxo, e vale para todos os boards dele."
      >
        {columnsEditor}
      </Modal>
      <ConfirmDialog
        open={removal.isOpen}
        title={`Excluir o board ${board.name}?`}
        description="Os cards do projeto não mudam: só este board deixa de existir."
        confirmLabel="Excluir board"
        isDestructive
        isConfirming={removal.isConfirming}
        onConfirm={removal.confirm}
        onCancel={removal.cancel}
      />
    </>
  );
}
