import type { ReactNode } from "react";
import { ProjectContent } from "./project-content";
import { ProjectTeam } from "./project-team";

type ProjectMemberListProps = {
  projectId: string;
  backLink: ReactNode;
};

export function ProjectMemberList({ projectId, backLink }: ProjectMemberListProps) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>{backLink}</div>
      <ProjectContent projectId={projectId}>
        {project => <ProjectTeam project={project} />}
      </ProjectContent>
    </div>
  );
}
