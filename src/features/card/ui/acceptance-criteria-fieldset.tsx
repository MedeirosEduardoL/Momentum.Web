import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Button } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/text-field";
import { CARD_LIMITS, type CardFormValues } from "../model/schemas/card.schema";

type AcceptanceCriteriaFieldsetProps = {
  form: UseFormReturn<CardFormValues>;
};

export function AcceptanceCriteriaFieldset({ form }: AcceptanceCriteriaFieldsetProps) {
  const criteria = useFieldArray({ control: form.control, name: "userStory.acceptanceCriteria" });
  const errors = form.formState.errors.userStory?.acceptanceCriteria;
  const hasRoomForAnother = criteria.fields.length < CARD_LIMITS.acceptanceCriteria;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-ink-muted">Critérios de aceite</legend>
      {criteria.fields.map((criterion, position) => (
        <div key={criterion.id} className="flex items-start gap-2">
          <TextField
            className="flex-1"
            label={`Critério ${position + 1}`}
            autoComplete="off"
            maxLength={CARD_LIMITS.acceptanceCriterion}
            error={errors?.[position]?.text?.message}
            {...form.register(`userStory.acceptanceCriteria.${position}.text`)}
          />
          <Button
            variant="ghost"
            size="sm"
            className="mt-7"
            aria-label={`Remover o critério ${position + 1}`}
            onClick={() => criteria.remove(position)}
          >
            Remover
          </Button>
        </div>
      ))}
      {errors?.message && (
        <p role="alert" className="text-sm text-danger">
          {errors.message}
        </p>
      )}
      <div>
        <Button
          variant="secondary"
          size="sm"
          disabled={!hasRoomForAnother}
          onClick={() => criteria.append({ text: "" })}
        >
          Adicionar critério
        </Button>
      </div>
    </fieldset>
  );
}
