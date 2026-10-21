import { useNavigate } from "@tanstack/react-router";
import { CreateEpicForm } from "@/features/feature";
import { renderHierarchyLink } from "../feature-links";

type NewEpicPageProps = {
  projectId: string;
};

export function NewEpicPage({ projectId }: NewEpicPageProps) {
  const navigate = useNavigate();

  return (
    <CreateEpicForm
      projectId={projectId}
      backLink={renderHierarchyLink(projectId)}
      onCreated={epic => navigate({ to: "/epics/$epicId", params: { epicId: epic.id } })}
    />
  );
}
