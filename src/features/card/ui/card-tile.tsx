import { useRef, useState, type DragEventHandler, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { SelectField, type SelectOption } from "@/shared/ui/select-field";
import { useOutsidePress } from "@/shared/ui/use-outside-press";
import { CARD_TYPE_EDGE_CLASSES } from "../model/lib/card-type-colors";
import type { CardMoveHandler, CardSummary, CardTaskKind } from "../model/types/card.types";
import { CardAssigneeChip } from "./card-assignee-chip";
import { CardIdentifier } from "./card-identifier";
import { CardPriorityBadge } from "./card-priority-badge";
import { CardTileActions } from "./card-tile-actions";
import { CardTileSubitemButtons } from "./card-tile-subitem-buttons";
import { CardTileSubitemList } from "./card-tile-subitem-list";

type CardTileProps = {
  card: CardSummary;
  titleLink: ReactNode;
  stateOptions: SelectOption[];
  assigneeOptions: SelectOption[];
  isLocked: boolean;
  isDragged: boolean;
  onDragStart: DragEventHandler<HTMLLIElement>;
  onDragEnd: DragEventHandler<HTMLLIElement>;
  onMove: CardMoveHandler;
  onSubitemsChanged: () => void;
};

export function CardTile({
  card,
  titleLink,
  stateOptions,
  assigneeOptions,
  isLocked,
  isDragged,
  onDragStart,
  onDragEnd,
  onMove,
  onSubitemsChanged,
}: CardTileProps) {
  const [openKind, setOpenKind] = useState<CardTaskKind | null>(null);
  const [addingKind, setAddingKind] = useState<CardTaskKind | null>(null);
  const tileRef = useRef<HTMLLIElement>(null);

  useOutsidePress({
    isActive: openKind !== null,
    refs: [tileRef],
    ignoresOverlays: true,
    onOutsidePress: closeSubitems,
  });

  function closeSubitems() {
    setAddingKind(null);
    setOpenKind(null);
  }

  function toggleKind(kind: CardTaskKind) {
    setAddingKind(null);
    setOpenKind(current => (current === kind ? null : kind));
  }

  function addSubitem(kind: CardTaskKind) {
    setAddingKind(kind);
    setOpenKind(kind);
  }

  return (
    <li
      ref={tileRef}
      draggable={!isLocked && openKind === null}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "glass flex flex-col gap-2 rounded-md border border-l-[3px] border-glass-line p-3 transition duration-150 ease-out hover:bg-surface",
        CARD_TYPE_EDGE_CLASSES[card.type],
        !isLocked && openKind === null && "cursor-grab",
        isDragged && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <CardIdentifier card={card} hasTypeMark={false} />
        <div className="-my-1 -mr-1 flex items-center gap-1">
          <CardPriorityBadge priority={card.priority} />
          <CardTileActions card={card} onAddSubitem={addSubitem} />
        </div>
      </div>
      <span className="font-medium break-words">{titleLink}</span>
      <CardTileSubitemButtons card={card} openKind={openKind} onToggle={toggleKind} />
      {openKind && (
        <CardTileSubitemList
          key={openKind}
          card={card}
          kind={openKind}
          assigneeOptions={assigneeOptions}
          shouldFocusForm={addingKind === openKind}
          onChanged={onSubitemsChanged}
        />
      )}
      <div className="flex items-center justify-between gap-2">
        <CardAssigneeChip assignee={card.assignee} />
        <SelectField
          variant="quiet"
          isLabelHidden
          label={`Estado de ${card.identifier}`}
          className="shrink-0"
          options={stateOptions}
          value={card.state.id}
          disabled={isLocked}
          onValueChange={cardStateId => onMove(card, { cardStateId })}
        />
      </div>
    </li>
  );
}
