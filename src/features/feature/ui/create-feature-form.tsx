import type { ReactNode } from "react";
import { ProjectContent } from "@/features/project";
import { Screen } from "@/shared/ui/screen";
import { useCreateFeature } from "../model/hooks/use-create-feature";
import type { Feature } from "../model/types/feature.types";
import { GroupForm } from "./group-form";

type CreateFeatureFormProps = {
  projectId: string;
  backLink: ReactNode;
  onCreated: (feature: Feature) => void;
};

export function CreateFeatureForm({ projectId, backLink, onCreated }: CreateFeatureFormProps) {
  const creation = useCreateFeature({ projectId, epicId: null, onCreated });

  return (
    <ProjectContent projectId={projectId}>
      {project => (
        <Screen backLink={backLink} title={`Nova feature em ${project.name}`}>
          <p className="text-ink-muted">
            Uma feature agrupa cards do projeto em torno de uma entrega. Ela nasce sem epic.
          </p>
          <GroupForm {...creation} submitLabel="Criar feature" />
        </Screen>
      )}
    </ProjectContent>
  );
}
