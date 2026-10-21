import { Pencil } from "lucide-react";
import { EpicDetail } from "@/features/feature";
import { ButtonLink } from "@/shared/ui/button-link";
import {
  renderFeatureCardsLink,
  renderFeatureLink,
  reportingHierarchyLink,
  renderNewEpicFeatureLink,
} from "../feature-links";

type EpicDetailPageProps = {
  epicId: string;
  onProjectChange: (projectId: string) => void;
};

export function EpicDetailPage({ epicId, onProjectChange }: EpicDetailPageProps) {
  return (
    <EpicDetail
      epicId={epicId}
      editLink={
        <ButtonLink to="/epics/$epicId/editar" params={{ epicId }} variant="secondary" size="sm">
          <Pencil aria-hidden />
          Editar
        </ButtonLink>
      }
      renderBackLink={reportingHierarchyLink(onProjectChange)}
      renderNewFeatureLink={renderNewEpicFeatureLink}
      renderFeatureLink={renderFeatureLink}
      renderCardsLink={renderFeatureCardsLink}
    />
  );
}
