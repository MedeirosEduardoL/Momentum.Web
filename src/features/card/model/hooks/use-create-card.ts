import { useForm } from "react-hook-form";
import { useListFeatures } from "@/features/feature";
import { useListProjectMembers } from "@/features/project";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { useCreateCardMutation } from "../../api/card.mutations";
import { toNewCard, toNewCardValues } from "../lib/card-form-values";
import { NO_ASSIGNEE, NO_FEATURE } from "../lib/card-options";
import { isAssigneeOutsideProject, isFeatureOutsideProject } from "../lib/card-refusal";
import { cardSchema, type CardFormValues } from "../schemas/card.schema";
import type { Card, CardState } from "../types/card.types";

type CreateCardOptions = {
  projectId: string;
  states: CardState[];
  onCreated: (card: Card) => void;
};

const cardResolver = zodResolver(cardSchema);

export function useCreateCard({ projectId, states, onCreated }: CreateCardOptions) {
  const team = useListProjectMembers(projectId);
  const features = useListFeatures(projectId);
  const createCard = useCreateCardMutation();
  const form = useForm<CardFormValues>({
    resolver: cardResolver,
    defaultValues: toNewCardValues(states),
  });

  function forgetPersonWhoLeftTheTeam() {
    form.setValue("assigneeId", NO_ASSIGNEE);
    void team.refetch();
  }

  function forgetRemovedFeature() {
    form.setValue("featureId", NO_FEATURE);
    void features.refetch();
  }

  const onSubmit = form.handleSubmit(async values => {
    try {
      onCreated(await createCard.mutateAsync(toNewCard(projectId, values)));
    } catch (error) {
      applyApiErrors(form, error);

      if (isAssigneeOutsideProject(error)) {
        forgetPersonWhoLeftTheTeam();
      }

      if (isFeatureOutsideProject(error)) {
        forgetRemovedFeature();
      }
    }
  });

  return { form, onSubmit, isSaving: createCard.isPending };
}
