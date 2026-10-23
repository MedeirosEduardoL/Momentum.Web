import type { ReactNode } from "react";
import type { CardListFilters, CardSummary } from "../model/types/card.types";
import { CardListFilterBar } from "./card-list-filter-bar";
import { CardListResults } from "./card-list-results";
import { CardOptionsContent } from "./card-options-content";

type BoardCardListProps = {
  boardId: string;
  projectId: string;
  filters: CardListFilters;
  onFiltersChange: (filters: CardListFilters) => void;
  renderCardLink: (card: CardSummary) => ReactNode;
};

export function BoardCardList({
  boardId,
  projectId,
  filters,
  onFiltersChange,
  renderCardLink,
}: BoardCardListProps) {
  return (
    <div className="flex flex-col gap-4">
      <CardOptionsContent projectId={projectId}>
        {options => (
          <CardListFilterBar
            projectId={projectId}
            options={options}
            filters={filters}
            isAssigneeHidden
            onFiltersChange={onFiltersChange}
          />
        )}
      </CardOptionsContent>
      <CardListResults
        query={{ boardId, ...filters }}
        onPageChange={page => onFiltersChange({ ...filters, page })}
        renderCardLink={renderCardLink}
      />
    </div>
  );
}
