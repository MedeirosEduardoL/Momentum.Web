import { useState } from "react";
import { useForm } from "react-hook-form";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { useUpdateCardMutation } from "../../api/card.mutations";
import { useGetCard } from "../../api/card.queries";
import { toCardChanges, toCardFormValues } from "../lib/card-form-values";
import { wasCardChangedMeanwhile } from "../lib/card-refusal";
import { cardSchema, type CardFormValues } from "../schemas/card.schema";
import type { Card } from "../types/card.types";

type EditCardOptions = {
  card: Card;
  onSaved: () => void;
};

const cardResolver = zodResolver(cardSchema);

export function useEditCard({ card, onSaved }: EditCardOptions) {
  const current = useGetCard(card.id);
  const updateCard = useUpdateCardMutation();
  const [readVersion, setReadVersion] = useState(card.updatedAt);
  const [hasChangedMeanwhile, setHasChangedMeanwhile] = useState(false);
  const form = useForm<CardFormValues>({
    resolver: cardResolver,
    defaultValues: toCardFormValues(card),
  });

  async function loadCurrentVersion() {
    const reloaded = await current.refetch();

    if (reloaded.data) {
      form.reset(toCardFormValues(reloaded.data));
      setReadVersion(reloaded.data.updatedAt);
      setHasChangedMeanwhile(false);
    }
  }

  const onSubmit = form.handleSubmit(async values => {
    setHasChangedMeanwhile(false);

    try {
      await updateCard.mutateAsync({
        cardId: card.id,
        expectedUpdatedAt: readVersion,
        ...toCardChanges(values),
      });
      onSaved();
    } catch (error) {
      if (wasCardChangedMeanwhile(error)) {
        setHasChangedMeanwhile(true);
        return;
      }

      applyApiErrors(form, error);
    }
  });

  return {
    form,
    onSubmit,
    isSaving: updateCard.isPending,
    hasChangedMeanwhile,
    loadCurrentVersion,
  };
}
