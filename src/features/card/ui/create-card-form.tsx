import type { ReactNode } from "react";
import { useWatch } from "react-hook-form";
import { ProjectContent } from "@/features/project";
import { Button } from "@/shared/ui/button";
import { Screen } from "@/shared/ui/screen";
import { SelectField } from "@/shared/ui/select-field";
import { useCreateCard } from "../model/hooks/use-create-card";
import {
  CARD_PRIORITY_OPTIONS,
  CARD_TYPE_OPTIONS,
  NO_ASSIGNEE_OPTION,
  NO_FEATURE_OPTION,
  toAssigneeOptions,
  toStateOptions,
} from "../model/lib/card-options";
import type { Card, CardOptions } from "../model/types/card.types";
import { CardFeatureSelect } from "./card-feature-select";
import { CardFormFields } from "./card-form-fields";
import { CardOptionsContent } from "./card-options-content";

type CreateCardFormProps = {
  projectId: string;
  backLink: ReactNode;
  onCreated: (card: Card) => void;
};

type NewCardFieldsProps = {
  projectId: string;
  options: CardOptions;
  onCreated: (card: Card) => void;
};

function NewCardFields({ projectId, options, onCreated }: NewCardFieldsProps) {
  const { form, onSubmit, isSaving } = useCreateCard({
    projectId,
    states: options.states,
    onCreated,
  });
  const { errors } = form.formState;
  const cardType = useWatch({ control: form.control, name: "cardType" });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <SelectField
        label="Tipo de card"
        className="max-w-48"
        options={CARD_TYPE_OPTIONS}
        error={errors.cardType?.message}
        {...form.register("cardType")}
      />
      <CardFormFields form={form} cardType={cardType} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SelectField
          label="Estado"
          options={toStateOptions(options.states)}
          error={errors.cardStateId?.message}
          {...form.register("cardStateId")}
        />
        <SelectField
          label="Prioridade"
          options={CARD_PRIORITY_OPTIONS}
          error={errors.priority?.message}
          {...form.register("priority")}
        />
        <SelectField
          label="Responsável"
          options={[NO_ASSIGNEE_OPTION, ...toAssigneeOptions(options.team)]}
          error={errors.assigneeId?.message}
          {...form.register("assigneeId")}
        />
      </div>
      <CardFeatureSelect
        label="Feature"
        projectId={projectId}
        emptyOption={NO_FEATURE_OPTION}
        className="max-w-sm"
        error={errors.featureId?.message}
        {...form.register("featureId")}
      />
      <div>
        <Button type="submit" isLoading={isSaving}>
          Criar card
        </Button>
      </div>
    </form>
  );
}

export function CreateCardForm({ projectId, backLink, onCreated }: CreateCardFormProps) {
  return (
    <ProjectContent projectId={projectId}>
      {project => (
        <Screen backLink={backLink} title={`Novo card em ${project.name}`}>
          <CardOptionsContent projectId={project.id}>
            {options => (
              <NewCardFields projectId={project.id} options={options} onCreated={onCreated} />
            )}
          </CardOptionsContent>
        </Screen>
      )}
    </ProjectContent>
  );
}
