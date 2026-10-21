import type { UseFormReturn } from "react-hook-form";
import { TextAreaField } from "@/shared/ui/text-area-field";
import { TextField } from "@/shared/ui/text-field";
import { CARD_LIMITS, type CardFormValues } from "../model/schemas/card.schema";
import type { CardType } from "../model/types/card.types";
import { CardTypeFieldset } from "./card-type-fieldset";

type CardFormFieldsProps = {
  form: UseFormReturn<CardFormValues>;
  cardType: CardType;
};

export function CardFormFields({ form, cardType }: CardFormFieldsProps) {
  const { errors } = form.formState;

  return (
    <>
      <TextField
        label="Título"
        autoComplete="off"
        maxLength={CARD_LIMITS.title}
        error={errors.title?.message}
        {...form.register("title")}
      />
      <TextAreaField
        label="Descrição"
        hint="Aceita markdown."
        rows={8}
        maxLength={CARD_LIMITS.description}
        error={errors.description?.message}
        {...form.register("description")}
      />
      <CardTypeFieldset form={form} cardType={cardType} />
    </>
  );
}
