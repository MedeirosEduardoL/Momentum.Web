import type { ReactNode } from "react";
import { PROJECT_ROLE_LABELS } from "../model/lib/project-role";
import type { Project } from "../model/types/project.types";

type ProjectTileProps = {
  project: Project;
  nameLink: ReactNode;
  action: ReactNode;
};

export function ProjectTile({ project, nameLink, action }: ProjectTileProps) {
  return (
    <li className="panel flex flex-col gap-4 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-accent-soft font-mono text-sm font-semibold text-accent-text">
          {project.key}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">{nameLink}</span>
          <span className="text-sm text-ink-muted">{PROJECT_ROLE_LABELS[project.role]}</span>
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3">{action}</div>
    </li>
  );
}
