import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { ProgressBar } from "@/shared/ui/progress-bar";

export type GroupKind = "feature" | "epic";

type GroupTileProps = {
  kind: GroupKind;
  titleLink: ReactNode;
  progressLabel: string;
  progress: number;
  details: string[];
};

const KIND_LABELS: Record<GroupKind, string> = { feature: "Feature", epic: "Epic" };

const KIND_EDGE_CLASSES: Record<GroupKind, string> = {
  feature: "border-l-type-feature",
  epic: "border-l-type-epic",
};

export function GroupTile({ kind, titleLink, progressLabel, progress, details }: GroupTileProps) {
  return (
    <li
      className={cn(
        "glass flex flex-col gap-2 rounded-md border border-l-[3px] border-glass-line p-3 transition duration-150 ease-out hover:bg-surface",
        KIND_EDGE_CLASSES[kind]
      )}
    >
      <span className="text-xs font-medium text-ink-subtle">{KIND_LABELS[kind]}</span>
      <span className="font-medium break-words">{titleLink}</span>
      <ProgressBar label={progressLabel} value={progress} />
      <span className="text-sm text-ink-muted">{details.join(" · ")}</span>
    </li>
  );
}
