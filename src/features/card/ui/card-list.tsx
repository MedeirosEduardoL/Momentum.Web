import type { ReactNode } from "react";
import { ProjectContent } from "@/features/project";
import { Screen } from "@/shared/ui/screen";
import type { CardListFilters, CardSummary } from "../model/types/card.types";
import { CardListFilterBar } from "./card-list-filter-bar";
import { CardListResults } from "./card-list-results";
import { CardOptionsContent } from "./card-options-content";

type CardListProps = {
  projectId: string;
  filters: CardListFilters;
  onFiltersChange: (filters: CardListFilters) => void;
  newCardLink: ReactNode;
  renderCardLink: (card: CardSummary) => ReactNode;
};

export function CardList({
  projectId,
  filters,
  onFiltersChange,
  newCardLink,
  renderCardLink,
}: CardListProps) {
  return (
    <ProjectContent projectId={projectId}>
      {project => (
        <Screen isWide title={`Cards de ${project.name}`} action={newCardLink}>
          <CardOptionsContent projectId={project.id}>
            {options => (
              <CardListFilterBar
                projectId={project.id}
                options={options}
                filters={filters}
                onFiltersChange={onFiltersChange}
              />
            )}
          </CardOptionsContent>
          <CardListResults
            query={{ projectId: project.id, ...filters }}
            onPageChange={page => onFiltersChange({ ...filters, page })}
            renderCardLink={renderCardLink}
          />
        </Screen>
      )}
    </ProjectContent>
  );
}
