import { useState, type ReactNode } from "react";
import { Screen } from "@/shared/ui/screen";
import { CardContent } from "./card-content";
import { CardHeaderMeta } from "./card-header-meta";
import { CardIdentifier } from "./card-identifier";
import { CardWorkItem, type CardWorkItemRenderers, type CardWorkItemTab } from "./card-work-item";

type CardDetailProps = CardWorkItemRenderers & {
  cardId: string;
  editLink: ReactNode;
  renderBackLink: (projectId: string) => ReactNode;
};

export function CardDetail({ cardId, editLink, renderBackLink, ...renderers }: CardDetailProps) {
  const [tab, setTab] = useState<CardWorkItemTab>("detalhes");

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
          <CardWorkItem card={card} tab={tab} onTabChange={setTab} {...renderers} />
        </Screen>
      )}
    </CardContent>
  );
}
