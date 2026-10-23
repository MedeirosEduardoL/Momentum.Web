import { Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { canAdministerProject, ProjectContent, type Project } from "@/features/project";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { Notice } from "@/shared/ui/notice";
import { QueryContent } from "@/shared/ui/query-content";
import { Screen } from "@/shared/ui/screen";
import { useListBoards } from "../api/board.queries";
import { isMissingBoard, selectBoard } from "../model/lib/board-selection";
import type { Board, BoardColumns, BoardGroupsView, BoardView } from "../model/types/board.types";
import { BoardFilterOptionsContent } from "./board-filter-options-content";
import { CreateBoardForm } from "./create-board-form";
import { EmptyBoardList } from "./empty-board-list";
import { SelectedBoard } from "./selected-board";

type BoardScreenLinks = {
  view: BoardView;
  onViewChange: (view: BoardView) => void;
  renderColumns: (columns: BoardColumns) => ReactNode;
  renderCardList: (board: Board) => ReactNode;
  renderGroups: (groups: BoardGroupsView) => ReactNode;
  renderColumnsEditor: (project: Project) => ReactNode;
};

type ProjectBoardProps = BoardScreenLinks & {
  projectId: string;
};

type BoardScreenProps = BoardScreenLinks & {
  project: Project;
};

const MISSING_BOARD_NOTICE =
  "O board deste endereço não existe mais: a tela mostra o primeiro board do projeto.";

function BoardScreen({
  project,
  view,
  onViewChange,
  renderColumns,
  renderCardList,
  renderGroups,
  renderColumnsEditor,
}: BoardScreenProps) {
  const boards = useListBoards(project.id);
  const [isCreating, setIsCreating] = useState(false);
  const [removedBoardId, setRemovedBoardId] = useState<string>();
  const canAdminister = canAdministerProject(project);
  const loadedBoards = boards.data ?? [];
  const board = selectBoard(loadedBoards, view.boardId);
  const showsMissingBoard =
    isMissingBoard(loadedBoards, view.boardId) && view.boardId !== removedBoardId;

  function showCreated(created: Board) {
    setIsCreating(false);
    onViewChange({ ...view, boardId: created.id });
  }

  return (
    <Screen
      isWide
      title={`Boards de ${project.name}`}
      action={
        canAdminister && (
          <Button size="sm" onClick={() => setIsCreating(true)}>
            <Plus aria-hidden />
            Novo board
          </Button>
        )
      }
    >
      <QueryContent
        query={boards}
        loadingLabel="Carregando os boards…"
        errorTitle="Não foi possível carregar os boards"
      >
        {boardList =>
          board ? (
            <>
              {showsMissingBoard && <Notice>{MISSING_BOARD_NOTICE}</Notice>}
              <SelectedBoard
                key={board.id}
                boards={boardList}
                board={board}
                view={view}
                onViewChange={onViewChange}
                canAdminister={canAdminister}
                onRemoving={removed => setRemovedBoardId(removed.id)}
                renderColumns={renderColumns}
                renderCardList={renderCardList}
                renderGroups={renderGroups}
                columnsEditor={renderColumnsEditor(project)}
              />
            </>
          ) : (
            <EmptyBoardList canAdminister={canAdminister} onCreate={() => setIsCreating(true)} />
          )
        }
      </QueryContent>
      <Modal
        open={isCreating}
        onOpenChange={setIsCreating}
        title="Novo board"
        description="Um board mostra, em colunas por estado, os cards do projeto que casam com o filtro."
      >
        <BoardFilterOptionsContent projectId={project.id}>
          {options => (
            <CreateBoardForm projectId={project.id} options={options} onCreated={showCreated} />
          )}
        </BoardFilterOptionsContent>
      </Modal>
    </Screen>
  );
}

export function ProjectBoard({ projectId, ...links }: ProjectBoardProps) {
  return (
    <ProjectContent projectId={projectId}>
      {project => <BoardScreen project={project} {...links} />}
    </ProjectContent>
  );
}
