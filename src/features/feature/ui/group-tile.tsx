import type { ReactNode } from "react";
import { ProgressBar } from "@/shared/ui/progress-bar";

type GroupTileProps = {
  kindLabel: string;
  titleLink: ReactNode;
  progressLabel: string;
  progress: number;
  details: string[];
};

export function GroupTile({
  kindLabel,
  titleLink,
  progressLabel,
  progress,
  details,
}: GroupTileProps) {
  return (
    <li className="glass flex flex-col gap-2 rounded-md border border-glass-line p-3 transition duration-150 ease-out hover:bg-surface">
      <span className="text-xs font-medium text-ink-subtle">{kindLabel}</span>
      <span className="font-medium break-words">{titleLink}</span>
      <ProgressBar label={progressLabel} value={progress} />
      <span className="text-sm text-ink-muted">{details.join(" · ")}</span>
    </li>
  );
}
