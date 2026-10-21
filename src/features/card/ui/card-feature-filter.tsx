import type { SelectOption } from "@/shared/ui/select-field";
import { NO_FEATURE } from "../model/lib/card-options";
import { CardFeatureSelect } from "./card-feature-select";

type CardFeatureFilterProps = {
  projectId: string;
  featureId?: string;
  onFeatureChange: (featureId?: string) => void;
};

const ANY_FEATURE_OPTION: SelectOption = { value: NO_FEATURE, label: "Todas" };

export function CardFeatureFilter({
  projectId,
  featureId,
  onFeatureChange,
}: CardFeatureFilterProps) {
  return (
    <CardFeatureSelect
      isLabelInline
      label="Feature"
      className="max-w-80"
      projectId={projectId}
      emptyOption={ANY_FEATURE_OPTION}
      value={featureId ?? NO_FEATURE}
      onValueChange={chosenFeatureId => onFeatureChange(chosenFeatureId || undefined)}
    />
  );
}
