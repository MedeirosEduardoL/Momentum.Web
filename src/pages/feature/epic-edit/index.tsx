import { useNavigate } from "@tanstack/react-router";
import { EditEpicForm } from "@/features/feature";
import { renderEpicBackLink } from "../feature-links";

type EpicEditPageProps = {
  epicId: string;
};

export function EpicEditPage({ epicId }: EpicEditPageProps) {
  const navigate = useNavigate();

  return (
    <EditEpicForm
      epicId={epicId}
      backLink={renderEpicBackLink(epicId)}
      onSaved={() => navigate({ to: "/epics/$epicId", params: { epicId } })}
    />
  );
}
