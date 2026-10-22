import { Plus } from "lucide-react";
import { CardList, type CardListFilters } from "@/features/card";
import { ButtonLink } from "@/shared/ui/button-link";
import { TextLink } from "@/shared/ui/text-link";
import { OpenedCardDialog } from "@/widgets/opened-card-dialog";

type CardListPageProps = {
  projectId: string;
  filters: CardListFilters;
  onFiltersChange: (filters: CardListFilters) => void;
  openCardId?: string;
  onOpenCardChange: (cardId?: string) => void;
};

export function CardListPage({
  projectId,
  filters,
  onFiltersChange,
  openCardId,
  onOpenCardChange,
}: CardListPageProps) {
  function renderCardOpening(card: { id: string; title: string }) {
    return (
      <TextLink
        to="/projetos/$projectId/cards"
        params={{ projectId }}
        search={previous => ({ ...previous, card: card.id })}
        className="text-ink"
      >
        {card.title}
      </TextLink>
    );
  }

  return (
    <>
      <CardList
        projectId={projectId}
        filters={filters}
        onFiltersChange={onFiltersChange}
        newCardLink={
          <ButtonLink to="/projetos/$projectId/cards/novo" params={{ projectId }} size="sm">
            <Plus aria-hidden />
            Novo card
          </ButtonLink>
        }
        renderCardLink={renderCardOpening}
      />
      {openCardId && (
        <OpenedCardDialog
          cardId={openCardId}
          onClose={() => onOpenCardChange(undefined)}
          renderRelatedCardLink={renderCardOpening}
        />
      )}
    </>
  );
}
