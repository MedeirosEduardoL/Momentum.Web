import { Pencil } from "lucide-react";
import { CardDetail, CardExtensionsProvider } from "@/features/card";
import { ButtonLink } from "@/shared/ui/button-link";
import { TextLink } from "@/shared/ui/text-link";
import { ValueReporter } from "@/shared/ui/value-reporter";
import { cardExtensions, cardPanels } from "@/widgets/card-panels";

type CardDetailPageProps = {
  cardId: string;
  onProjectChange: (projectId: string) => void;
};

export function CardDetailPage({ cardId, onProjectChange }: CardDetailPageProps) {
  return (
    <CardExtensionsProvider value={cardExtensions}>
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
            <TextLink to="/projetos/$projectId/boards" params={{ projectId }}>
              Voltar para o board
            </TextLink>
          </>
        )}
        renderRelatedCardLink={card => (
          <TextLink to="/cards/$cardId" params={{ cardId: card.id }} className="text-ink">
            {card.title}
          </TextLink>
        )}
        {...cardPanels}
      />
    </CardExtensionsProvider>
  );
}
