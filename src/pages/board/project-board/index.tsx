import { useNavigate } from "@tanstack/react-router";
import { ProjectBoard, type BoardView } from "@/features/board";
import { CardStateColumns, CardStateSettings } from "@/features/card";
import { toAssigneeSearch } from "@/shared/lib/assignee-search";
import { TextLink } from "@/shared/ui/text-link";

type ProjectBoardPageProps = {
  projectId: string;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
};

export function ProjectBoardPage({ projectId, view, onViewChange }: ProjectBoardPageProps) {
  const navigate = useNavigate();

  return (
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
          onOpenCard={card => navigate({ to: "/cards/$cardId", params: { cardId: card.id } })}
          renderCardLink={card => (
            <TextLink
              to="/cards/$cardId"
              params={{ cardId: card.id }}
              draggable={false}
              className="text-ink"
            >
              {card.title}
            </TextLink>
          )}
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
  );
}
