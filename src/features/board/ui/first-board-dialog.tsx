import { toast } from "sonner";
import type { Project } from "@/features/project";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { NO_FILTER } from "../model/lib/board-filter";
import type { Board, BoardDefinition } from "../model/types/board.types";
import { BoardFilterOptionsContent } from "./board-filter-options-content";
import { CreateBoardForm } from "./create-board-form";

type FirstBoardDialogProps = {
  project: Project;
  onFinished: () => void;
};

const FIRST_BOARD: BoardDefinition = { name: "Todos os cards", filter: NO_FILTER };

export function FirstBoardDialog({ project, onFinished }: FirstBoardDialogProps) {
  function showCreated(board: Board) {
    toast.success(`O board ${board.name} foi criado.`);
    onFinished();
  }

  return (
    <Modal
      open
      onOpenChange={isOpen => !isOpen && onFinished()}
      title="Crie o primeiro board"
      description={`O projeto ${project.name} foi criado. Um board mostra os cards dele em colunas, uma por estado; sem filtro, mostra todos. Se pular, dá para criar depois, na tela de boards do projeto.`}
      footer={
        <Button variant="ghost" onClick={onFinished}>
          Pular
        </Button>
      }
    >
      <BoardFilterOptionsContent projectId={project.id}>
        {options => (
          <CreateBoardForm
            projectId={project.id}
            board={FIRST_BOARD}
            options={options}
            onCreated={showCreated}
          />
        )}
      </BoardFilterOptionsContent>
    </Modal>
  );
}
