import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import type { SelectOption } from "@/shared/ui/select-field";
import type { CardDrag } from "../model/hooks/use-card-drag";
import { describeLaneCount } from "../model/lib/card-state-columns";
import type { CardLane, CardMoveHandler, CardState, CardSummary } from "../model/types/card.types";
import { CardTile } from "./card-tile";

type CardLaneRowProps = {
  lane: CardLane;
  drag: CardDrag;
  stateOptions: SelectOption[];
  assigneeOptions: SelectOption[];
  isLocked: boolean;
  onMove: CardMoveHandler;
  onSubitemsChanged: () => void;
  renderCardLink: (card: CardSummary) => ReactNode;
};

function zoneIdOf(lane: CardLane, state: CardState) {
  return `${lane.id}:${state.id}`;
}

function nameZone(lane: CardLane, state: CardState) {
  return lane.title ? `${state.name} de ${lane.title}` : state.name;
}

export function CardLaneRow({
  lane,
  drag,
  stateOptions,
  assigneeOptions,
  isLocked,
  onMove,
  onSubitemsChanged,
  renderCardLink,
}: CardLaneRowProps) {
  return (
    <section className="flex flex-col gap-2">
      {lane.title && (
        <div className="flex items-baseline gap-2 px-1 text-sm">
          <h3 className="font-medium text-ink-muted">{lane.title}</h3>
          <span className="text-ink-subtle">{describeLaneCount(lane)}</span>
        </div>
      )}
      <div className="flex gap-3">
        {lane.cells.map(({ state, cards }) => (
          <ul
            key={state.id}
            aria-label={nameZone(lane, state)}
            className={cn(
              "flex min-h-24 min-w-64 flex-1 flex-col gap-2 rounded-lg border border-transparent bg-well p-2 transition-colors duration-150 ease-out",
              drag.targetZoneId === zoneIdOf(lane, state) && "border-accent-text bg-accent-soft/60"
            )}
            {...drag.zoneOf(zoneIdOf(lane, state), {
              cardStateId: state.id,
              assignee: lane.assignee,
            })}
          >
            {cards.map(card => (
              <CardTile
                key={card.id}
                card={card}
                titleLink={renderCardLink(card)}
                stateOptions={stateOptions}
                assigneeOptions={assigneeOptions}
                isLocked={isLocked}
                isDragged={drag.draggedCardId === card.id}
                onMove={onMove}
                onSubitemsChanged={onSubitemsChanged}
                {...drag.sourceOf(card)}
              />
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
