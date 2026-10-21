import { useNavigate } from "@tanstack/react-router";
import { CreateEpicFeatureForm } from "@/features/feature";
import { renderEpicBackLink } from "../feature-links";

type NewEpicFeaturePageProps = {
  epicId: string;
};

export function NewEpicFeaturePage({ epicId }: NewEpicFeaturePageProps) {
  const navigate = useNavigate();

  return (
    <CreateEpicFeatureForm
      epicId={epicId}
      backLink={renderEpicBackLink(epicId)}
      onCreated={feature =>
        navigate({ to: "/features/$featureId", params: { featureId: feature.id } })
      }
    />
  );
}
