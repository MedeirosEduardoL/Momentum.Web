import type { ReactNode } from "react";
import type { EpicSummary, FeatureSummary } from "@/features/feature";
import { MarkdownSection } from "@/shared/ui/markdown-section";
import type { Card } from "../model/types/card.types";
import { CardFeature } from "./card-feature";
import { CardOptionsContent } from "./card-options-content";
import { CardProperties } from "./card-properties";
import { CardTasks } from "./card-tasks";
import { CardTypeDetails } from "./card-type-details";

type CardDetailsTabProps = {
  card: Card;
  renderFeatureLink: (feature: FeatureSummary) => ReactNode;
  renderEpicLink: (epic: EpicSummary) => ReactNode;
};

export function CardDetailsTab({ card, renderFeatureLink, renderEpicLink }: CardDetailsTabProps) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <aside aria-label="Detalhes do card" className="flex flex-col gap-6 lg:order-last">
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
        <MarkdownSection title="Descrição" content={card.description} emptyText="Sem descrição." />
        <CardTypeDetails fields={card.fields} />
        <CardTasks card={card} />
      </div>
    </div>
  );
}
