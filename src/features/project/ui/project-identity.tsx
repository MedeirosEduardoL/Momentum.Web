import { cn } from "@/shared/lib/cn";
import { useListProjects } from "../api/project.queries";

type ProjectIdentityProps = {
  projectId: string;
  keySlotClassName?: string;
};

export function ProjectIdentity({ projectId, keySlotClassName }: ProjectIdentityProps) {
  const projects = useListProjects();
  const project = projects.data?.find(candidate => candidate.id === projectId);

  if (!project) {
    return null;
  }

  return (
    <span className="flex min-w-0 items-center gap-2" title={project.name}>
      <span className={cn("flex shrink-0 justify-center", keySlotClassName)}>
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-sm bg-accent-soft px-1 font-mono text-xs font-semibold text-accent-text">
          {project.key}
        </span>
      </span>
      <span className="truncate font-semibold text-ink">{project.name}</span>
    </span>
  );
}
