import type { ReactNode } from "react";
import { QueryContent } from "@/shared/ui/query-content";
import { Screen } from "@/shared/ui/screen";
import { useGetEpic } from "../api/feature.queries";
import { useCreateFeature } from "../model/hooks/use-create-feature";
import type { Epic, Feature } from "../model/types/feature.types";
import { GroupForm } from "./group-form";

type NewFeatureScreenProps = {
  backLink: ReactNode;
  onCreated: (feature: Feature) => void;
};

type CreateEpicFeatureFormProps = NewFeatureScreenProps & {
  epicId: string;
};

type EpicFeatureScreenProps = NewFeatureScreenProps & {
  epic: Epic;
};

function EpicFeatureScreen({ epic, backLink, onCreated }: EpicFeatureScreenProps) {
  const creation = useCreateFeature({ projectId: epic.projectId, epicId: epic.id, onCreated });

  return (
    <Screen backLink={backLink} title={`Nova feature em ${epic.title}`}>
      <p className="text-ink-muted">
        Uma feature agrupa cards do projeto em torno de uma entrega. Ela nasce dentro deste epic.
      </p>
      <GroupForm {...creation} submitLabel="Criar feature" />
    </Screen>
  );
}

export function CreateEpicFeatureForm({ epicId, ...screen }: CreateEpicFeatureFormProps) {
  const epic = useGetEpic(epicId);

  return (
    <QueryContent
      query={epic}
      loadingLabel="Carregando o epic…"
      errorTitle="Não foi possível carregar o epic"
    >
      {loadedEpic => <EpicFeatureScreen epic={loadedEpic} {...screen} />}
    </QueryContent>
  );
}
