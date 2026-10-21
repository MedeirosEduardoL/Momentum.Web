import { Pencil } from "lucide-react";
import { CardDetail } from "@/features/card";
import { CardBriefSection } from "@/features/card-brief";
import { CardInterviews } from "@/features/card-interview";
import { ButtonLink } from "@/shared/ui/button-link";
import { TextLink } from "@/shared/ui/text-link";
import { ValueReporter } from "@/shared/ui/value-reporter";

type CardDetailPageProps = {
  cardId: string;
  onProjectChange: (projectId: string) => void;
};

export function CardDetailPage({ cardId, onProjectChange }: CardDetailPageProps) {
  return (
    <CardDetail
      cardId={cardId}
      editLink={
        <ButtonLink to="/cards/$cardId/editar" params={{ cardId }} variant="secondary" size="sm">
          <Pencil aria-hidden />
          Editar
        </ButtonLink>
      }
      renderBackLink={projectId => (
        <>
          <ValueReporter value={projectId} onReport={onProjectChange} />
          <TextLink to="/projetos/$projectId/cards" params={{ projectId }}>
            Voltar para os cards do projeto
          </TextLink>
        </>
      )}
      renderFeatureLink={feature => (
        <TextLink to="/features/$featureId" params={{ featureId: feature.id }}>
          Abrir a feature
        </TextLink>
      )}
      renderEpicLink={epic => (
        <TextLink to="/epics/$epicId" params={{ epicId: epic.id }}>
          {epic.title}
        </TextLink>
      )}
      renderRelatedCardLink={card => (
        <TextLink to="/cards/$cardId" params={{ cardId: card.id }} className="text-ink">
          {card.title}
        </TextLink>
      )}
      renderInterviews={card => <CardInterviews card={card} />}
      renderBrief={card => <CardBriefSection card={card} />}
    />
  );
}
