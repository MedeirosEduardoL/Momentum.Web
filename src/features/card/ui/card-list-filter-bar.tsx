import { SelectField, type SelectOption } from "@/shared/ui/select-field";
import { refineCardList, type CardListRefinement } from "../model/lib/card-list-filters";
import { CARD_TYPE_OPTIONS, toAssigneeOptions, toStateOptions } from "../model/lib/card-options";
import type { CardListFilters, CardOptions, CardType } from "../model/types/card.types";
import { CardFeatureFilter } from "./card-feature-filter";

type CardListFilterBarProps = {
  projectId: string;
  options: CardOptions;
  filters: CardListFilters;
  onFiltersChange: (filters: CardListFilters) => void;
};

type ArchivedChoice = "hidden" | "included";

const ANY = "";
const ANY_LABEL = "Todos";
const WITHOUT_ASSIGNEE = "sem-responsavel";

const ANY_TYPE_OPTION: SelectOption<CardType | typeof ANY> = { value: ANY, label: ANY_LABEL };
const ANY_OPTION: SelectOption = { value: ANY, label: ANY_LABEL };
const WITHOUT_ASSIGNEE_OPTION: SelectOption = { value: WITHOUT_ASSIGNEE, label: "Sem responsável" };

const ARCHIVED_OPTIONS: SelectOption<ArchivedChoice>[] = [
  { value: "hidden", label: "Ocultos" },
  { value: "included", label: "Incluídos" },
];

export function CardListFilterBar({
  projectId,
  options,
  filters,
  onFiltersChange,
}: CardListFilterBarProps) {
  const refine = (refinement: CardListRefinement) =>
    onFiltersChange(refineCardList(filters, refinement));

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <SelectField
        isLabelInline
        label="Tipo"
        options={[ANY_TYPE_OPTION, ...CARD_TYPE_OPTIONS]}
        value={filters.type ?? ANY}
        onValueChange={type => refine({ type: type || undefined })}
      />
      <SelectField
        isLabelInline
        label="Estado"
        options={[ANY_OPTION, ...toStateOptions(options.states)]}
        value={filters.stateId ?? ANY}
        onValueChange={stateId => refine({ stateId: stateId || undefined })}
      />
      <SelectField
        isLabelInline
        label="Responsável"
        options={[ANY_OPTION, WITHOUT_ASSIGNEE_OPTION, ...toAssigneeOptions(options.team)]}
        value={filters.isUnassigned ? WITHOUT_ASSIGNEE : (filters.assigneeId ?? ANY)}
        onValueChange={choice =>
          refine(
            choice === WITHOUT_ASSIGNEE
              ? { assigneeId: undefined, isUnassigned: true }
              : { assigneeId: choice || undefined, isUnassigned: undefined }
          )
        }
      />
      <CardFeatureFilter
        projectId={projectId}
        featureId={filters.featureId}
        onFeatureChange={featureId => refine({ featureId })}
      />
      <SelectField
        isLabelInline
        label="Arquivados"
        options={ARCHIVED_OPTIONS}
        value={filters.includesArchived ? "included" : "hidden"}
        onValueChange={choice => refine({ includesArchived: choice === "included" })}
      />
    </div>
  );
}
