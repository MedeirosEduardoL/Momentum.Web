import { AttachmentPanel } from "@/features/attachment";
import type { Card, CardExtensions } from "@/features/card";
import { CardBriefSection } from "@/features/card-brief";
import { CardInterviews } from "@/features/card-interview";
import type { EpicSummary, FeatureSummary } from "@/features/feature";
import { TextLink } from "@/shared/ui/text-link";

export const cardPanels = {
  renderFeatureLink: (feature: FeatureSummary) => (
    <TextLink to="/features/$featureId" params={{ featureId: feature.id }}>
      Abrir a feature
    </TextLink>
  ),
  renderEpicLink: (epic: EpicSummary) => (
    <TextLink to="/epics/$epicId" params={{ epicId: epic.id }}>
      {epic.title}
    </TextLink>
  ),
  renderAttachments: (card: Card) => (
    <AttachmentPanel target={{ kind: "card", id: card.id }} projectId={card.projectId} />
  ),
  renderInterviews: (card: Card) => <CardInterviews card={card} />,
  renderBrief: (card: Card) => <CardBriefSection card={card} />,
};

export const cardExtensions: CardExtensions = {
  renderSubitemAttachments: (task, projectId) => (
    <AttachmentPanel target={{ kind: "cardTask", id: task.id }} projectId={projectId} />
  ),
};
