import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { describeColumnCount, isTruncated } from "../model/lib/card-state-columns";
import { CARD_STATE_CATEGORY_EDGE_CLASSES } from "../model/lib/card-tones";
import type { CardStateColumn } from "../model/types/card.types";

type CardStateColumnHeaderProps = {
  column: CardStateColumn;
  cardsLink: ReactNode;
  children?: ReactNode;
};

export function CardStateColumnHeader({ column, cardsLink, children }: CardStateColumnHeaderProps) {
  return (
    <header className="flex min-w-64 flex-1 flex-col gap-2">
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-t-2 px-1 pt-2",
          CARD_STATE_CATEGORY_EDGE_CLASSES[column.state.category]
        )}
      >
        <h2 className="truncate font-semibold">{column.state.name}</h2>
        <span className="shrink-0 rounded-full bg-surface-raised px-2 py-0.5 text-xs font-medium text-ink-muted tabular-nums">
          {describeColumnCount(column)}
        </span>
      </div>
      {isTruncated(column) && (
        <p className="px-1 text-sm text-ink-subtle">Só os mais novos aparecem aqui. {cardsLink}</p>
      )}
      {children}
    </header>
  );
}
