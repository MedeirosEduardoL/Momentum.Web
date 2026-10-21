import type { UseFormReturn } from "react-hook-form";
import { SelectField, type SelectOption } from "@/shared/ui/select-field";
import { TextAreaField } from "@/shared/ui/text-area-field";
import { TextField } from "@/shared/ui/text-field";
import { ISSUE_SEVERITY_OPTIONS } from "../model/lib/card-options";
import { CARD_LIMITS, NO_SEVERITY, type CardFormValues } from "../model/schemas/card.schema";
import type { CardType, IssueSeverity } from "../model/types/card.types";
import { AcceptanceCriteriaFieldset } from "./acceptance-criteria-fieldset";

type TypeFieldsetProps = {
  form: UseFormReturn<CardFormValues>;
};

type CardTypeFieldsetProps = TypeFieldsetProps & {
  cardType: CardType;
};

const MARKDOWN_HINT = "Aceita markdown.";

const SEVERITY_OPTIONS: SelectOption<IssueSeverity | typeof NO_SEVERITY>[] = [
  { value: NO_SEVERITY, label: "Não informada" },
  ...ISSUE_SEVERITY_OPTIONS,
];

function SpikeFieldset({ form }: TypeFieldsetProps) {
  const errors = form.formState.errors.spike;

  return (
    <>
      <TextAreaField
        label="Pergunta"
        hint={`A incerteza que o spike precisa reduzir. ${MARKDOWN_HINT}`}
        maxLength={CARD_LIMITS.typeText}
        error={errors?.question?.message}
        {...form.register("spike.question")}
      />
      <TextField
        label="Prazo"
        type="date"
        className="max-w-48"
        error={errors?.deadline?.message}
        {...form.register("spike.deadline")}
      />
      <TextAreaField
        label="Conclusão"
        hint={`Preenchida ao concluir o spike. ${MARKDOWN_HINT}`}
        maxLength={CARD_LIMITS.typeText}
        error={errors?.conclusion?.message}
        {...form.register("spike.conclusion")}
      />
    </>
  );
}

function IssueFieldset({ form }: TypeFieldsetProps) {
  const errors = form.formState.errors.issue;

  return (
    <>
      <TextAreaField
        label="Passos para reproduzir"
        hint={MARKDOWN_HINT}
        maxLength={CARD_LIMITS.typeText}
        error={errors?.stepsToReproduce?.message}
        {...form.register("issue.stepsToReproduce")}
      />
      <TextAreaField
        label="Comportamento esperado"
        hint={MARKDOWN_HINT}
        maxLength={CARD_LIMITS.typeText}
        error={errors?.expectedBehavior?.message}
        {...form.register("issue.expectedBehavior")}
      />
      <TextAreaField
        label="Comportamento observado"
        hint={MARKDOWN_HINT}
        maxLength={CARD_LIMITS.typeText}
        error={errors?.observedBehavior?.message}
        {...form.register("issue.observedBehavior")}
      />
      <SelectField
        label="Severidade"
        className="max-w-48"
        options={SEVERITY_OPTIONS}
        error={errors?.severity?.message}
        {...form.register("issue.severity")}
      />
      <TextField
        label="Local"
        hint="Onde o comportamento errado ocorre: tela, rota ou arquivo."
        autoComplete="off"
        maxLength={CARD_LIMITS.location}
        error={errors?.location?.message}
        {...form.register("issue.location")}
      />
    </>
  );
}

function TechDebtFieldset({ form }: TypeFieldsetProps) {
  return (
    <TextAreaField
      label="Impacto"
      hint={`O que a dívida técnica custa enquanto não é paga. ${MARKDOWN_HINT}`}
      maxLength={CARD_LIMITS.typeText}
      error={form.formState.errors.techDebt?.impact?.message}
      {...form.register("techDebt.impact")}
    />
  );
}

export function CardTypeFieldset({ form, cardType }: CardTypeFieldsetProps) {
  switch (cardType) {
    case "user_story":
      return <AcceptanceCriteriaFieldset form={form} />;
    case "spike":
      return <SpikeFieldset form={form} />;
    case "issue":
      return <IssueFieldset form={form} />;
    case "tech_debt":
      return <TechDebtFieldset form={form} />;
  }
}
