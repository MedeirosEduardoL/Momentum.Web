import type { ReactNode } from "react";
import { useListProjectMembers } from "@/features/project";
import { useCardDrag } from "../model/hooks/use-card-drag";
import { useCompletionConfirmation } from "../model/hooks/use-completion-confirmation";
import { useMoveCard } from "../model/hooks/use-move-card";
import { toQuickCardDefaults } from "../model/lib/card-form-values";
import { NO_ASSIGNEE_OPTION, toAssigneeOptions, toStateOptions } from "../model/lib/card-options";
import { moveCard, toCardLanes } from "../model/lib/card-state-columns";
import type {
  Card,
  CardAssigneeFilter,
  CardPlace,
  CardState,
  CardStateColumn,
  CardSummary,
  SavedCardFilter,
} from "../model/types/card.types";
import { CardCompletionDialog } from "./card-completion-dialog";
import { CardLaneRow } from "./card-lane-row";
import { CardQuickCreate } from "./card-quick-create";
import { CardStateColumnHeader } from "./card-state-column-header";

type CardStateColumnsProps = {
  projectId: string;
  columns: CardStateColumn[];
  isGroupedByAssignee: boolean;
  assigneeFilter: CardAssigneeFilter;
  savedFilter: SavedCardFilter;
  reload: () => Promise<CardStateColumn[] | undefined>;
  onOpenCard: (card: Card) => void;
  renderCardLink: (card: CardSummary) => ReactNode;
  renderStateCardsLink: (state: CardState) => ReactNode;
};

export function CardStateColumns({
  projectId,
  columns,
  isGroupedByAssignee,
  assigneeFilter,
  savedFilter,
  reload,
  onOpenCard,
  renderCardLink,
  renderStateCardsLink,
}: CardStateColumnsProps) {
  const states = columns.map(column => column.state);
  const team = useListProjectMembers(projectId);
  const { move, pendingMove } = useMoveCard(reload);
  const completion = useCompletionConfirmation(states);
  const requestMove = (card: CardSummary, place: CardPlace) =>
    completion.request(card, place.cardStateId, () => void move(card, place));
  const drag = useCardDrag(requestMove);
  const shownColumns = moveCard(columns, pendingMove);
  const stateOptions = toStateOptions(states);
  const assigneeOptions = [NO_ASSIGNEE_OPTION, ...toAssigneeOptions(team.data ?? [])];
  const isMoving = pendingMove !== null;
  const grouping = isGroupedByAssignee
    ? {
        ...assigneeFilter,
        savedAssigneeIds: savedFilter.assigneeIds,
        team: team.data ?? [],
      }
    : null;

  return (
    <div className="relative overflow-x-auto pb-2">
      <div aria-busy={isMoving} className="flex flex-col gap-3">
        <div className="flex gap-3">
          {shownColumns.map((column, index) => (
            <CardStateColumnHeader
              key={column.state.id}
              column={column}
              cardsLink={renderStateCardsLink(column.state)}
            >
              {index === 0 && (
                <CardQuickCreate
                  projectId={projectId}
                  defaults={toQuickCardDefaults(column.state.id, assigneeFilter, savedFilter)}
                  reload={reload}
                  onOpenCard={onOpenCard}
                />
              )}
            </CardStateColumnHeader>
          ))}
        </div>
        {toCardLanes(shownColumns, grouping).map(lane => (
          <CardLaneRow
            key={lane.id}
            lane={lane}
            drag={drag}
            stateOptions={stateOptions}
            assigneeOptions={assigneeOptions}
            isLocked={isMoving}
            onMove={requestMove}
            onSubitemsChanged={() => void reload()}
            renderCardLink={renderCardLink}
          />
        ))}
      </div>
      <CardCompletionDialog completion={completion} />
    </div>
  );
}
