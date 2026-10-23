import { ProjectBoard, useRefreshBoardColumns, type BoardView } from "@/features/board";
import {
  BoardCardList,
  CardExtensionsProvider,
  CardStateColumns,
  CardStateSettings,
  type CardListFilters,
} from "@/features/card";
import { BoardGroups, type FeatureSummary } from "@/features/feature";
import { TextLink } from "@/shared/ui/text-link";
import { cardExtensions } from "@/widgets/card-panels";
import {
  renderEpicLink,
  renderFeatureLink,
  renderNewEpicFeatureLink,
  renderNewEpicLink,
  renderNewFeatureLink,
} from "@/widgets/group-links";
import { OpenedCardDialog } from "@/widgets/opened-card-dialog";

type ProjectBoardPageProps = {
  projectId: string;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
  listFilters: CardListFilters;
  onListFiltersChange: (filters: CardListFilters) => void;
  openCardId?: string;
  onOpenCardChange: (cardId?: string) => void;
};

export function ProjectBoardPage({
  projectId,
  view,
  onViewChange,
  listFilters,
  onListFiltersChange,
  openCardId,
  onOpenCardChange,
}: ProjectBoardPageProps) {
  const refreshColumns = useRefreshBoardColumns();

  function closeCard() {
    onOpenCardChange(undefined);
    void refreshColumns();
  }

  function renderCardOpening(card: { id: string; title: string }) {
    return (
      <TextLink
        to="/projetos/$projectId/boards"
        params={{ projectId }}
        search={previous => ({ ...previous, card: card.id })}
        draggable={false}
        className="text-ink"
      >
        {card.title}
      </TextLink>
    );
  }

  function renderBoardFeatureCardsLink(feature: FeatureSummary) {
    return (
      <TextLink
        to="/projetos/$projectId/boards"
        params={{ projectId }}
        search={previous => ({
          board: previous.board,
          exibir: "lista",
          feature: feature.id,
        })}
        aria-label={`Cards de ${feature.title}`}
      >
        Cards
      </TextLink>
    );
  }

  return (
    <CardExtensionsProvider value={cardExtensions}>
      <ProjectBoard
        projectId={projectId}
        view={view}
        onViewChange={onViewChange}
        renderColumnsEditor={project => (
          <CardStateSettings projectId={project.id} projectName={project.name} canAdminister />
        )}
        renderColumns={({ columns, savedFilter, reload }) => (
          <CardStateColumns
            projectId={projectId}
            columns={columns}
            isGroupedByAssignee={view.isGroupedByAssignee}
            assigneeFilter={{ assigneeId: view.assigneeId, isUnassigned: view.isUnassigned }}
            savedFilter={savedFilter}
            reload={reload}
            onOpenCard={card => onOpenCardChange(card.id)}
            renderCardLink={renderCardOpening}
            renderStateCardsLink={state => (
              <TextLink
                to="/projetos/$projectId/boards"
                params={{ projectId }}
                search={previous => ({ ...previous, exibir: "lista", estado: state.id })}
                aria-label={`Ver na lista os cards em ${state.name}`}
              >
                Ver na lista
              </TextLink>
            )}
          />
        )}
        renderCardList={board => (
          <BoardCardList
            boardId={board.id}
            projectId={projectId}
            filters={listFilters}
            onFiltersChange={onListFiltersChange}
            renderCardLink={renderCardOpening}
          />
        )}
        renderGroups={({ board, level, isList }) => (
          <BoardGroups
            boardId={board.id}
            level={level}
            isList={isList}
            newEpicLink={renderNewEpicLink(projectId)}
            newFeatureWithoutEpicLink={renderNewFeatureLink(projectId)}
            renderEpicLink={renderEpicLink}
            renderNewFeatureLink={renderNewEpicFeatureLink}
            renderFeatureLink={renderFeatureLink}
            renderCardsLink={renderBoardFeatureCardsLink}
          />
        )}
      />
      {openCardId && (
        <OpenedCardDialog
          cardId={openCardId}
          onClose={closeCard}
          renderRelatedCardLink={renderCardOpening}
        />
      )}
    </CardExtensionsProvider>
  );
}
