import { Badge } from "@/shared/ui/badge";
import { CARD_STATE_CATEGORY_TONES } from "../model/lib/card-tones";
import type { Card } from "../model/types/card.types";
import { CardAssigneeChip } from "./card-assignee-chip";
import { CardPriorityBadge } from "./card-priority-badge";

type CardHeaderMetaProps = {
  card: Card;
};

export function CardHeaderMeta({ card }: CardHeaderMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Badge tone={CARD_STATE_CATEGORY_TONES[card.state.category]}>
        <span className="sr-only">Estado </span>
        {card.state.name}
      </Badge>
      <CardAssigneeChip assignee={card.assignee} />
      <CardPriorityBadge priority={card.priority} />
    </div>
  );
}
