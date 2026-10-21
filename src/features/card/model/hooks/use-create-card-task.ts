import { useForm } from "react-hook-form";
import { useListProjectMembers } from "@/features/project";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { useCreateCardTaskMutation } from "../../api/card.mutations";
import { NO_ASSIGNEE } from "../lib/card-options";
import { isAssigneeOutsideProject } from "../lib/card-refusal";
import { cardTaskSchema, type CardTaskFormValues } from "../schemas/card-task.schema";
import type { CardSummary, CardTaskKind } from "../types/card.types";

type CreateCardTaskOptions = {
  kind?: CardTaskKind;
  onCreated?: () => void;
};

const cardTaskResolver = zodResolver(cardTaskSchema);

export function useCreateCardTask(
  card: Pick<CardSummary, "id" | "projectId">,
  { kind: initialKind = "task", onCreated }: CreateCardTaskOptions = {}
) {
  const team = useListProjectMembers(card.projectId);
  const createTask = useCreateCardTaskMutation();
  const form = useForm<CardTaskFormValues>({
    resolver: cardTaskResolver,
    defaultValues: { kind: initialKind, title: "", assigneeId: NO_ASSIGNEE },
  });

  function forgetPersonWhoLeftTheTeam() {
    form.setValue("assigneeId", NO_ASSIGNEE);
    void team.refetch();
  }

  const onSubmit = form.handleSubmit(async ({ kind, title, assigneeId }) => {
    try {
      await createTask.mutateAsync({
        cardId: card.id,
        kind,
        title,
        assigneeId: assigneeId || null,
      });
      form.reset({ kind, title: "", assigneeId: NO_ASSIGNEE });
      onCreated?.();
    } catch (error) {
      applyApiErrors(form, error);

      if (isAssigneeOutsideProject(error)) {
        forgetPersonWhoLeftTheTeam();
      }
    }
  });

  return { form, onSubmit, isSaving: createTask.isPending };
}
