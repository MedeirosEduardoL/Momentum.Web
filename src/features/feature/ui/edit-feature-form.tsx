import type { ReactNode } from "react";
import { QueryContent } from "@/shared/ui/query-content";
import { Screen } from "@/shared/ui/screen";
import { useGetFeature } from "../api/feature.queries";
import { useEditFeature } from "../model/hooks/use-edit-feature";
import type { Feature } from "../model/types/feature.types";
import { GroupForm } from "./group-form";

type EditFeatureFormProps = {
  featureId: string;
  backLink: ReactNode;
  onSaved: () => void;
};

type FeatureFieldsProps = {
  feature: Feature;
  onSaved: () => void;
};

function FeatureFields({ feature, onSaved }: FeatureFieldsProps) {
  const edition = useEditFeature({ feature, onSaved });

  return <GroupForm {...edition} submitLabel="Salvar feature" />;
}

export function EditFeatureForm({ featureId, backLink, onSaved }: EditFeatureFormProps) {
  const feature = useGetFeature(featureId);

  return (
    <QueryContent
      query={feature}
      loadingLabel="Carregando a feature…"
      errorTitle="Não foi possível carregar a feature"
    >
      {loadedFeature => (
        <Screen backLink={backLink} title="Editar feature">
          <FeatureFields feature={loadedFeature} onSaved={onSaved} />
        </Screen>
      )}
    </QueryContent>
  );
}
