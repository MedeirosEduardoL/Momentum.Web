import type { ReactNode } from "react";
import { PROJECT_ROLE_LABELS } from "../model/lib/project-role";
import type { Project } from "../model/types/project.types";

type ProjectListItemProps = {
  project: Project;
  nameLink: ReactNode;
  action?: ReactNode;
};

export function ProjectListItem({ project, nameLink, action }: ProjectListItemProps) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="w-14 font-mono text-sm text-ink-subtle">{project.key}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{nameLink}</span>
      <span className="text-sm text-ink-muted">{PROJECT_ROLE_LABELS[project.role]}</span>
      {action}
    </li>
  );
}
