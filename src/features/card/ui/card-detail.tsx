import type { ReactNode } from "react";
import type { EpicSummary, FeatureSummary } from "@/features/feature";
import { MarkdownSection } from "@/shared/ui/markdown-section";
import { Notice } from "@/shared/ui/notice";
import { Screen } from "@/shared/ui/screen";
import type { Card, RelatedCard } from "../model/types/card.types";
import { CardContent } from "./card-content";
import { CardFeature } from "./card-feature";
import { CardHeaderMeta } from "./card-header-meta";
import { CardIdentifier } from "./card-identifier";
import { CardOptionsContent } from "./card-options-content";
import { CardProperties } from "./card-properties";
import { CardRelations } from "./card-relations";
import { CardTasks } from "./card-tasks";
import { CardTypeDetails } from "./card-type-details";

type CardDetailProps = {
  cardId: string;
  editLink: ReactNode;
  renderBackLink: (projectId: string) => ReactNode;
  renderFeatureLink: (feature: FeatureSummary) => ReactNode;
  renderEpicLink: (epic: EpicSummary) => ReactNode;
  renderRelatedCardLink: (card: RelatedCard) => ReactNode;
  renderInterviews: (card: Card) => ReactNode;
  renderBrief: (card: Card) => ReactNode;
};

export function CardDetail({
  cardId,
  editLink,
  renderBackLink,
  renderFeatureLink,
  renderEpicLink,
  renderRelatedCardLink,
  renderInterviews,
  renderBrief,
}: CardDetailProps) {
  return (
    <CardContent cardId={cardId}>
      {card => (
        <Screen
          isWide
          backLink={renderBackLink(card.projectId)}
          eyebrow={<CardIdentifier card={card} />}
          title={card.title}
          meta={<CardHeaderMeta card={card} />}
          action={editLink}
        >
          {card.isArchived && (
            <Notice>Este card está arquivado: não aparece na lista nem nos boards.</Notice>
          )}
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <aside
              aria-label="Detalhes do card"
              className="flex flex-col gap-6 lg:sticky lg:top-16 lg:order-last"
            >
              <CardOptionsContent projectId={card.projectId}>
                {options => <CardProperties card={card} options={options} />}
              </CardOptionsContent>
              <CardFeature
                card={card}
                renderFeatureLink={renderFeatureLink}
                renderEpicLink={renderEpicLink}
              />
            </aside>
            <div className="flex min-w-0 flex-col gap-6">
              <MarkdownSection
                title="Descrição"
                content={card.description}
                emptyText="Sem descrição."
              />
              <CardTypeDetails fields={card.fields} />
              <CardTasks card={card} />
              <CardRelations card={card} renderCardLink={renderRelatedCardLink} />
              {renderInterviews(card)}
              {renderBrief(card)}
            </div>
          </div>
        </Screen>
      )}
    </CardContent>
  );
}
