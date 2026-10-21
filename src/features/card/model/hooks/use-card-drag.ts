import { useState, type DragEvent } from "react";
import { changesPlace } from "../lib/card-state-columns";
import type { CardMoveHandler, CardPlace, CardSummary } from "../types/card.types";

export type CardDrag = ReturnType<typeof useCardDrag>;

const MOVE = "move";
const DRAG_DATA_FORMAT = "text/plain";

function isLeavingZone({ currentTarget, relatedTarget }: DragEvent<HTMLElement>) {
  return !(relatedTarget instanceof Node && currentTarget.contains(relatedTarget));
}

export function useCardDrag(onDrop: CardMoveHandler) {
  const [draggedCard, setDraggedCard] = useState<CardSummary | null>(null);
  const [targetZoneId, setTargetZoneId] = useState<string | null>(null);

  function stop() {
    setDraggedCard(null);
    setTargetZoneId(null);
  }

  function findCardFor(place: CardPlace) {
    return draggedCard && changesPlace(draggedCard, place) ? draggedCard : null;
  }

  function startWith(card: CardSummary) {
    return (event: DragEvent<HTMLElement>) => {
      event.dataTransfer.effectAllowed = MOVE;
      event.dataTransfer.setData(DRAG_DATA_FORMAT, card.identifier);
      setDraggedCard(card);
    };
  }

  function hoverOver(zoneId: string, place: CardPlace) {
    return (event: DragEvent<HTMLElement>) => {
      if (!findCardFor(place)) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = MOVE;
      setTargetZoneId(zoneId);
    };
  }

  function leave(event: DragEvent<HTMLElement>) {
    if (isLeavingZone(event)) {
      setTargetZoneId(null);
    }
  }

  function dropIn(place: CardPlace) {
    return (event: DragEvent<HTMLElement>) => {
      const card = findCardFor(place);

      if (!card) {
        return;
      }

      event.preventDefault();
      onDrop(card, place);
      stop();
    };
  }

  return {
    draggedCardId: draggedCard?.id ?? null,
    targetZoneId,
    sourceOf: (card: CardSummary) => ({ onDragStart: startWith(card), onDragEnd: stop }),
    zoneOf: (zoneId: string, place: CardPlace) => ({
      onDragOver: hoverOver(zoneId, place),
      onDragLeave: leave,
      onDrop: dropIn(place),
    }),
  };
}
