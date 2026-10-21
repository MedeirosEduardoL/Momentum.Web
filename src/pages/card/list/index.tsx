import { Plus } from "lucide-react";
import { CardList, type CardListFilters } from "@/features/card";
import { ButtonLink } from "@/shared/ui/button-link";
import { TextLink } from "@/shared/ui/text-link";

type CardListPageProps = {
  projectId: string;
  filters: CardListFilters;
  onFiltersChange: (filters: CardListFilters) => void;
};

export function CardListPage({ projectId, filters, onFiltersChange }: CardListPageProps) {
  return (
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
      renderCardLink={card => (
        <TextLink to="/cards/$cardId" params={{ cardId: card.id }} className="text-ink">
          {card.title}
        </TextLink>
      )}
    />
  );
}
