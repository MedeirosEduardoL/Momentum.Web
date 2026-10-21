import type { ComponentProps } from "react";
import { useListFeatures } from "@/features/feature";
import { SelectField, type SelectOption } from "@/shared/ui/select-field";
import { toFeatureOptions } from "../model/lib/card-options";

type CardFeatureSelectProps = Omit<ComponentProps<typeof SelectField<string>>, "options"> & {
  projectId: string;
  emptyOption: SelectOption;
};

const FEATURES_FAILED = "Não foi possível carregar as features.";

export function CardFeatureSelect({
  projectId,
  emptyOption,
  error,
  ...selectProps
}: CardFeatureSelectProps) {
  const features = useListFeatures(projectId);

  return (
    <SelectField
      options={[emptyOption, ...toFeatureOptions(features.data ?? [])]}
      disabled={features.isPending}
      error={error ?? (features.isError ? FEATURES_FAILED : undefined)}
      {...selectProps}
    />
  );
}
