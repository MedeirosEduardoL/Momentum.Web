import { cn } from "@/shared/lib/cn";
import { CARD_TYPE_MARK_CLASSES } from "../model/lib/card-type-colors";
import type { CardType } from "../model/types/card.types";

type CardTypeMarkProps = {
  type: CardType;
};

export function CardTypeMark({ type }: CardTypeMarkProps) {
  return (
    <span
      aria-hidden
      className={cn("h-3.5 w-[3px] shrink-0 rounded-full", CARD_TYPE_MARK_CLASSES[type])}
    />
  );
}
