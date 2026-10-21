import { Badge } from "@/shared/ui/badge";
import { CARD_PRIORITY_LABELS } from "../model/lib/card-options";
import { CARD_PRIORITY_TONES, isHighlightedPriority } from "../model/lib/card-tones";
import type { CardPriority } from "../model/types/card.types";

type CardPriorityBadgeProps = {
  priority: CardPriority;
};

export function CardPriorityBadge({ priority }: CardPriorityBadgeProps) {
  if (!isHighlightedPriority(priority)) {
    return null;
  }

  return (
    <Badge tone={CARD_PRIORITY_TONES[priority]}>
      <span className="sr-only">Prioridade </span>
      {CARD_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
