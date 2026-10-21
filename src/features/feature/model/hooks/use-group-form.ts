import { useForm } from "react-hook-form";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { groupSchema, type GroupFormValues } from "../schemas/group.schema";
import type { GroupText } from "../types/feature.types";

type GroupFormOptions<TSaved> = {
  text?: GroupText;
  save: (text: GroupText) => Promise<TSaved>;
  isSaving: boolean;
  onSaved: (saved: TSaved) => void;
};

const NO_TEXT: GroupText = { title: "", description: "" };
const EPIC_ERROR_FIELD = "root.epic";

const groupResolver = zodResolver(groupSchema);

export function useGroupForm<TSaved>({
  text = NO_TEXT,
  save,
  isSaving,
  onSaved,
}: GroupFormOptions<TSaved>) {
  const form = useForm<GroupFormValues>({
    resolver: groupResolver,
    defaultValues: { title: text.title, description: text.description },
  });

  const onSubmit = form.handleSubmit(async values => {
    try {
      onSaved(await save(values));
    } catch (error) {
      applyApiErrors(form, error, { epicId: EPIC_ERROR_FIELD });
    }
  });

  return { form, onSubmit, isSaving, epicError: form.formState.errors.root?.epic?.message };
}
