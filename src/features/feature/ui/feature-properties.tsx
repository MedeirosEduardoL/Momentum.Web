import type { ReactNode } from "react";
import { QueryContent } from "@/shared/ui/query-content";
import { SelectField } from "@/shared/ui/select-field";
import { useListEpics } from "../api/feature.queries";
import { useFeatureEpic } from "../model/hooks/use-feature-epic";
import { NO_EPIC_OPTION, toEpicOptions } from "../model/lib/epic-options";
import { describeFeature } from "../model/lib/group-description";
import type { Feature } from "../model/types/feature.types";

type FeaturePropertiesProps = {
  feature: Feature;
  cardsLink: ReactNode;
};

export function FeatureProperties({ feature, cardsLink }: FeaturePropertiesProps) {
  const epics = useListEpics(feature.projectId);
  const { changeEpic, isBusy, selectedEpicId } = useFeatureEpic(feature);

  return (
    <div className="flex flex-col gap-4 panel p-4">
      <QueryContent
        query={epics}
        loadingLabel="Carregando os epics…"
        errorTitle="Não foi possível carregar os epics"
      >
        {epicList => (
          <SelectField
            label="Epic"
            className="max-w-sm"
            options={[NO_EPIC_OPTION, ...toEpicOptions(epicList)]}
            value={selectedEpicId}
            disabled={isBusy}
            onValueChange={changeEpic}
          />
        )}
      </QueryContent>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-ink-muted">{describeFeature(feature)}</span>
        {cardsLink}
      </div>
    </div>
  );
}
