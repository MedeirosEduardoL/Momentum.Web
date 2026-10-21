import { cn } from "@/shared/lib/cn";
import { CARD_TASK_KIND_PLURAL_LABELS } from "../model/lib/card-options";
import {
  describeSubitemCount,
  isOpenImpediment,
  listPresentKinds,
} from "../model/lib/card-subitems";
import type { CardSummary, CardTaskKind } from "../model/types/card.types";
import { CardSubitemKindIcon } from "./card-subitem-kind-icon";

type CardTileSubitemButtonsProps = {
  card: CardSummary;
  openKind: CardTaskKind | null;
  onToggle: (kind: CardTaskKind) => void;
};

export function CardTileSubitemButtons({ card, openKind, onToggle }: CardTileSubitemButtonsProps) {
  const kinds = listPresentKinds(card.subitemCounts);

  if (kinds.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {kinds.map(kind => {
        const count = card.subitemCounts[kind];

        return (
          <button
            key={kind}
            type="button"
            aria-expanded={openKind === kind}
            aria-label={`${CARD_TASK_KIND_PLURAL_LABELS[kind]} de ${card.identifier}: ${count.done} de ${count.total} concluídos`}
            onClick={() => onToggle(kind)}
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-xs font-medium tabular-nums transition-colors duration-150 ease-out",
              isOpenImpediment(kind, count)
                ? "bg-danger-soft text-danger hover:bg-danger-soft/80"
                : "text-ink-muted hover:bg-surface-raised hover:text-ink",
              openKind === kind && "ring-1 ring-line-strong"
            )}
          >
            <CardSubitemKindIcon kind={kind} />
            {CARD_TASK_KIND_PLURAL_LABELS[kind]} {describeSubitemCount(count)}
          </button>
        );
      })}
    </div>
  );
}
