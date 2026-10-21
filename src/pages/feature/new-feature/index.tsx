import { useNavigate } from "@tanstack/react-router";
import { CreateFeatureForm } from "@/features/feature";
import { renderHierarchyLink } from "../feature-links";

type NewFeaturePageProps = {
  projectId: string;
};

export function NewFeaturePage({ projectId }: NewFeaturePageProps) {
  const navigate = useNavigate();

  return (
    <CreateFeatureForm
      projectId={projectId}
      backLink={renderHierarchyLink(projectId)}
      onCreated={feature =>
        navigate({ to: "/features/$featureId", params: { featureId: feature.id } })
      }
    />
  );
}
