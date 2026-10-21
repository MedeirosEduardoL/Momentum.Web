import { useUpdateEpicMutation } from "../../api/feature.mutations";
import type { Epic } from "../types/feature.types";
import { useGroupForm } from "./use-group-form";

type EditEpicOptions = {
  epic: Epic;
  onSaved: () => void;
};

export function useEditEpic({ epic, onSaved }: EditEpicOptions) {
  const updateEpic = useUpdateEpicMutation();

  return useGroupForm({
    text: epic,
    save: text => updateEpic.mutateAsync({ epicId: epic.id, ...text }),
    isSaving: updateEpic.isPending,
    onSaved,
  });
}
