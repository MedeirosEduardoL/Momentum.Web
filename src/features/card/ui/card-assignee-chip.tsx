import { UserRound } from "lucide-react";
import { Avatar } from "@/shared/ui/avatar";
import { NO_ASSIGNEE_OPTION } from "../model/lib/card-options";
import type { CardAssignee } from "../model/types/card.types";

type CardAssigneeChipProps = {
  assignee: CardAssignee | null;
};

export function CardAssigneeChip({ assignee }: CardAssigneeChipProps) {
  const name = assignee?.name ?? NO_ASSIGNEE_OPTION.label;

  return (
    <span className="flex min-w-0 items-center gap-1.5 text-sm text-ink-muted">
      {assignee ? (
        <>
          <Avatar name={assignee.name} className="size-6" />
          <span className="sr-only">Responsável: </span>
        </>
      ) : (
        <span
          aria-hidden
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-ink-subtle"
        >
          <UserRound className="size-3.5" />
        </span>
      )}
      <span className="truncate" title={name}>
        {name}
      </span>
    </span>
  );
}
