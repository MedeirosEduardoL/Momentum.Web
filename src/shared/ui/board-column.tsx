import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type BoardColumnTone = "neutral" | "info" | "success";

type BoardColumnProps = {
  title: string;
  count: number;
  tone: BoardColumnTone;
  emptyText: string;
  children: ReactNode;
};

const EDGE_CLASSES: Record<BoardColumnTone, string> = {
  neutral: "border-t-line-strong",
  info: "border-t-info",
  success: "border-t-success",
};

export function BoardColumn({ title, count, tone, emptyText, children }: BoardColumnProps) {
  return (
    <section aria-label={title} className="flex min-w-64 flex-1 flex-col gap-2">
      <header
        className={cn(
          "flex items-center justify-between gap-2 border-t-2 px-1 pt-2",
          EDGE_CLASSES[tone]
        )}
      >
        <h2 className="truncate font-semibold">{title}</h2>
        <span className="shrink-0 rounded-full bg-surface-raised px-2 py-0.5 text-xs font-medium text-ink-muted tabular-nums">
          {count}
        </span>
      </header>
      <div className="flex min-h-24 flex-1 flex-col gap-2 rounded-md bg-well p-2">
        {count === 0 ? <p className="px-1 py-2 text-sm text-ink-subtle">{emptyText}</p> : children}
      </div>
    </section>
  );
}
