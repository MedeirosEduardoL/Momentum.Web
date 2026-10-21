import { CARD_TYPE_LABELS } from "../model/lib/card-options";
import type { CardSummary } from "../model/types/card.types";
import { CardTypeMark } from "./card-type-mark";

type CardIdentifierProps = {
  card: CardSummary;
  hasTypeMark?: boolean;
};

export function CardIdentifier({ card, hasTypeMark = true }: CardIdentifierProps) {
  return (
    <p className="flex items-center gap-2 text-sm text-ink-muted">
      {hasTypeMark && <CardTypeMark type={card.type} />}
      <span className="font-mono text-ink-subtle">{card.identifier}</span>
      <span>{CARD_TYPE_LABELS[card.type]}</span>
    </p>
  );
}
