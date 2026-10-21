import type { ReactNode } from "react";
import { Badge } from "@/shared/ui/badge";
import { CARD_PRIORITY_LABELS, CARD_TYPE_LABELS } from "../model/lib/card-options";
import { CARD_PRIORITY_TONES, CARD_STATE_CATEGORY_TONES } from "../model/lib/card-tones";
import type { CardSummary } from "../model/types/card.types";
import { CardTypeMark } from "./card-type-mark";

type CardListItemProps = {
  card: CardSummary;
  titleLink: ReactNode;
};

const CELL = "px-3 py-2 align-middle";

export function CardListItem({ card, titleLink }: CardListItemProps) {
  return (
    <tr className="relative border-b border-line transition-colors duration-150 ease-out last:border-b-0 focus-within:bg-surface-raised hover:bg-surface-raised">
      <td className={CELL}>
        <span className="flex items-center gap-2 font-mono text-sm whitespace-nowrap text-ink-subtle">
          <CardTypeMark type={card.type} />
          {card.identifier}
        </span>
      </td>
      <td className={`${CELL} max-w-0 w-full`}>
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium [&_a]:after:absolute [&_a]:after:inset-0">
            {titleLink}
          </span>
          {card.isArchived && <Badge>Arquivado</Badge>}
        </span>
      </td>
      <td className={`${CELL} text-sm whitespace-nowrap text-ink-muted`}>
        {CARD_TYPE_LABELS[card.type]}
      </td>
      <td className={CELL}>
        <Badge tone={CARD_STATE_CATEGORY_TONES[card.state.category]}>{card.state.name}</Badge>
      </td>
      <td className={`${CELL} text-sm whitespace-nowrap text-ink-muted`}>
        {card.assignee?.name ?? "Sem responsável"}
      </td>
      <td className={CELL}>
        <Badge tone={CARD_PRIORITY_TONES[card.priority]}>
          {CARD_PRIORITY_LABELS[card.priority]}
        </Badge>
      </td>
      <td className={`${CELL} text-right text-sm text-ink-muted tabular-nums max-xl:hidden`}>
        {card.progress}%
      </td>
    </tr>
  );
}
