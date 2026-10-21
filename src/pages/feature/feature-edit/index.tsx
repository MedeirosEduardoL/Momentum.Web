import { useNavigate } from "@tanstack/react-router";
import { EditFeatureForm } from "@/features/feature";
import { TextLink } from "@/shared/ui/text-link";

type FeatureEditPageProps = {
  featureId: string;
};

export function FeatureEditPage({ featureId }: FeatureEditPageProps) {
  const navigate = useNavigate();

  return (
    <EditFeatureForm
      featureId={featureId}
      backLink={
        <TextLink to="/features/$featureId" params={{ featureId }}>
          Voltar para a feature
        </TextLink>
      }
      onSaved={() => navigate({ to: "/features/$featureId", params: { featureId } })}
    />
  );
}
