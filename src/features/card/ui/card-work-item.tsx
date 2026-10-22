import { FileCode2, FileText, Link2, Paperclip, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { EpicSummary, FeatureSummary } from "@/features/feature";
import { Notice } from "@/shared/ui/notice";
import { Tabs } from "@/shared/ui/tabs";
import { useListCardRelations } from "../api/card.queries";
import type { Card, RelatedCard } from "../model/types/card.types";
import { CardDetailsTab } from "./card-details-tab";
import { CardEditFields } from "./card-edit-fields";
import { CardRelations } from "./card-relations";

export type CardWorkItemTab = "detalhes" | "relacoes" | "anexos" | "entrevista" | "briefing";

export type CardWorkItemRenderers = {
  renderFeatureLink: (feature: FeatureSummary) => ReactNode;
  renderEpicLink: (epic: EpicSummary) => ReactNode;
  renderRelatedCardLink: (card: RelatedCard) => ReactNode;
  renderAttachments: (card: Card) => ReactNode;
  renderInterviews: (card: Card) => ReactNode;
  renderBrief: (card: Card) => ReactNode;
};

type CardWorkItemProps = CardWorkItemRenderers & {
  card: Card;
  tab: CardWorkItemTab;
  onTabChange: (tab: CardWorkItemTab) => void;
  isEditing?: boolean;
  onEditDone?: () => void;
};

export function CardWorkItem({
  card,
  tab,
  onTabChange,
  isEditing = false,
  onEditDone = () => undefined,
  renderFeatureLink,
  renderEpicLink,
  renderRelatedCardLink,
  renderAttachments,
  renderInterviews,
  renderBrief,
}: CardWorkItemProps) {
  const relations = useListCardRelations(card.id);

  return (
    <div className="flex flex-col gap-4">
      {card.isArchived && (
        <Notice>Este card está arquivado: não aparece na lista nem nos boards.</Notice>
      )}
      <Tabs
        label={`Seções de ${card.identifier}`}
        value={tab}
        onValueChange={onTabChange}
        tabs={[
          {
            value: "detalhes",
            label: "Detalhes",
            icon: <FileText aria-hidden />,
            content: isEditing ? (
              <CardEditFields card={card} onSaved={onEditDone} onCancel={onEditDone} />
            ) : (
              <CardDetailsTab
                card={card}
                renderFeatureLink={renderFeatureLink}
                renderEpicLink={renderEpicLink}
              />
            ),
          },
          {
            value: "relacoes",
            label: "Relações",
            icon: <Link2 aria-hidden />,
            count: relations.data?.length,
            content: <CardRelations card={card} renderCardLink={renderRelatedCardLink} />,
          },
          {
            value: "anexos",
            label: "Anexos",
            icon: <Paperclip aria-hidden />,
            content: renderAttachments(card),
          },
          {
            value: "entrevista",
            label: "Entrevista com IA",
            icon: <Sparkles aria-hidden />,
            content: renderInterviews(card),
          },
          {
            value: "briefing",
            label: "Briefing",
            icon: <FileCode2 aria-hidden />,
            content: renderBrief(card),
          },
        ]}
      />
    </div>
  );
}
