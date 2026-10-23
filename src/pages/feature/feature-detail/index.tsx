import { Pencil } from "lucide-react";
import { AttachmentPanel } from "@/features/attachment";
import { FeatureDetail } from "@/features/feature";
import { ButtonLink } from "@/shared/ui/button-link";
import { renderFeatureCardsLink } from "@/widgets/group-links";
import { reportingHierarchyLink } from "../feature-links";

type FeatureDetailPageProps = {
  featureId: string;
  onProjectChange: (projectId: string) => void;
};

export function FeatureDetailPage({ featureId, onProjectChange }: FeatureDetailPageProps) {
  return (
    <FeatureDetail
      featureId={featureId}
      editLink={
        <ButtonLink
          to="/features/$featureId/editar"
          params={{ featureId }}
          variant="secondary"
          size="sm"
        >
          <Pencil aria-hidden />
          Editar
        </ButtonLink>
      }
      renderBackLink={reportingHierarchyLink(onProjectChange)}
      renderCardsLink={renderFeatureCardsLink}
      renderAttachments={feature => (
        <AttachmentPanel
          target={{ kind: "feature", id: feature.id }}
          projectId={feature.projectId}
        />
      )}
    />
  );
}
