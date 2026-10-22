import { ProjectBoard, useRefreshBoardColumns, type BoardView } from "@/features/board";
import { CardExtensionsProvider, CardStateColumns, CardStateSettings } from "@/features/card";
import { toAssigneeSearch } from "@/shared/lib/assignee-search";
import { TextLink } from "@/shared/ui/text-link";
import { cardExtensions } from "@/widgets/card-panels";
import { OpenedCardDialog } from "@/widgets/opened-card-dialog";

type ProjectBoardPageProps = {
  projectId: string;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
  openCardId?: string;
  onOpenCardChange: (cardId?: string) => void;
};

export function ProjectBoardPage({
  projectId,
  view,
  onViewChange,
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

  return (
    <CardExtensionsProvider value={cardExtensions}>
      <ProjectBoard
        projectId={projectId}
        view={view}
        onViewChange={onViewChange}
        cardsLink={
          <TextLink to="/projetos/$projectId/cards" params={{ projectId }}>
            Abrir a lista de cards
          </TextLink>
        }
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
                to="/projetos/$projectId/cards"
                params={{ projectId }}
                search={{ estado: state.id, responsavel: toAssigneeSearch(view) }}
                aria-label={`Ver na lista os cards em ${state.name}`}
              >
                Ver na lista
              </TextLink>
            )}
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
