import type { ReactNode } from "react";
import { ProjectContent } from "@/features/project";
import { Screen } from "@/shared/ui/screen";
import { useCreateEpic } from "../model/hooks/use-create-epic";
import type { Epic } from "../model/types/feature.types";
import { GroupForm } from "./group-form";

type CreateEpicFormProps = {
  projectId: string;
  backLink: ReactNode;
  onCreated: (epic: Epic) => void;
};

export function CreateEpicForm({ projectId, backLink, onCreated }: CreateEpicFormProps) {
  const creation = useCreateEpic({ projectId, onCreated });

  return (
    <ProjectContent projectId={projectId}>
      {project => (
        <Screen backLink={backLink} title={`Novo epic em ${project.name}`}>
          <p className="text-ink-muted">
            Um epic agrupa features do projeto em torno de um objetivo maior.
          </p>
          <GroupForm {...creation} submitLabel="Criar epic" />
        </Screen>
      )}
    </ProjectContent>
  );
}
