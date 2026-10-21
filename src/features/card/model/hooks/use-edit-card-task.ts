import { useState } from "react";
import { useForm } from "react-hook-form";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { useUpdateCardTaskMutation } from "../../api/card.mutations";
import { useListCardTasks } from "../../api/card.queries";
import { wasCardTaskChangedMeanwhile } from "../lib/card-refusal";
import { cardTaskDetailsSchema, type CardTaskDetailsFormValues } from "../schemas/card-task.schema";
import type { CardTask } from "../types/card.types";

type EditCardTaskOptions = {
  task: CardTask;
  onSaved: () => void;
};

const cardTaskDetailsResolver = zodResolver(cardTaskDetailsSchema);

function toDetails({ title, description }: CardTask): CardTaskDetailsFormValues {
  return { title, description };
}

export function useEditCardTask({ task, onSaved }: EditCardTaskOptions) {
  const tasks = useListCardTasks(task.cardId);
  const update = useUpdateCardTaskMutation();
  const [readVersion, setReadVersion] = useState(task.updatedAt);
  const [hasChangedMeanwhile, setHasChangedMeanwhile] = useState(false);
  const form = useForm<CardTaskDetailsFormValues>({
    resolver: cardTaskDetailsResolver,
    defaultValues: toDetails(task),
  });

  async function loadCurrentVersion() {
    const reloaded = await tasks.refetch();
    const current = reloaded.data?.find(candidate => candidate.id === task.id);

    if (current) {
      form.reset(toDetails(current));
      setReadVersion(current.updatedAt);
      setHasChangedMeanwhile(false);
    }
  }

  const onSubmit = form.handleSubmit(async values => {
    setHasChangedMeanwhile(false);

    try {
      await update.mutateAsync({ cardTaskId: task.id, ...values, expectedUpdatedAt: readVersion });
      onSaved();
    } catch (error) {
      if (wasCardTaskChangedMeanwhile(error)) {
        setHasChangedMeanwhile(true);
        return;
      }

      applyApiErrors(form, error);
    }
  });

  return {
    form,
    onSubmit,
    isSaving: update.isPending,
    hasChangedMeanwhile,
    loadCurrentVersion,
  };
}
