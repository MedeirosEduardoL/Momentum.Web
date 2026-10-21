import { useState } from "react";
import { useForm } from "react-hook-form";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { toastApiError } from "@/shared/api/toast-api-error";
import { zodResolver } from "@/shared/lib/zod-resolver";
import {
  useCreateCardStateMutation,
  useDeleteCardStateMutation,
  useUpdateCardStateMutation,
} from "../../api/card.mutations";
import { cardStateSchema, type CardStateFormValues } from "../schemas/card-state.schema";
import type { CardState } from "../types/card.types";

const cardStateResolver = zodResolver(cardStateSchema);
const NEW_STATE: CardStateFormValues = { name: "", category: "in_progress" };

export type CardStateEditing = { kind: "new" } | { kind: "existing"; state: CardState } | null;

export function useCardStateSettings(projectId: string) {
  const createState = useCreateCardStateMutation();
  const updateState = useUpdateCardStateMutation();
  const deleteState = useDeleteCardStateMutation();
  const [editing, setEditing] = useState<CardStateEditing>(null);
  const form = useForm<CardStateFormValues>({
    resolver: cardStateResolver,
    defaultValues: NEW_STATE,
  });

  function startNew() {
    form.reset(NEW_STATE);
    setEditing({ kind: "new" });
  }

  function startEditing(state: CardState) {
    form.reset({ name: state.name, category: state.category });
    setEditing({ kind: "existing", state });
  }

  const onSubmit = form.handleSubmit(async values => {
    try {
      if (editing?.kind === "existing") {
        await updateState.mutateAsync({ cardStateId: editing.state.id, ...values });
      } else {
        await createState.mutateAsync({ projectId, ...values });
      }
      setEditing(null);
    } catch (error) {
      applyApiErrors(form, error);
    }
  });

  async function move(state: CardState, position: number) {
    try {
      await updateState.mutateAsync({ cardStateId: state.id, position });
    } catch (error) {
      toastApiError(error);
    }
  }

  async function remove(state: CardState) {
    try {
      await deleteState.mutateAsync(state.id);
    } catch (error) {
      toastApiError(error);
    }
  }

  return {
    form,
    editing,
    startNew,
    startEditing,
    stopEditing: () => setEditing(null),
    onSubmit,
    move,
    remove,
    isSaving: createState.isPending || updateState.isPending,
    isBusy: updateState.isPending || deleteState.isPending,
  };
}
