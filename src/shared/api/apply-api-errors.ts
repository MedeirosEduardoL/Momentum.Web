import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { toApiError, type ApiErrorItem } from "./api-error";

type FormWithErrors<TValues extends FieldValues> = {
  setError: UseFormSetError<TValues>;
};

type FieldErrorItem = ApiErrorItem & { property: string };

type FormLevelField = `root.${string}`;

type FieldByProperty<TValues extends FieldValues> = Partial<
  Record<string, Path<TValues> | FormLevelField>
>;

function isFieldError(item: ApiErrorItem): item is FieldErrorItem {
  return item.property !== null;
}

export function applyApiErrors<TValues extends FieldValues>(
  form: FormWithErrors<TValues>,
  error: unknown,
  fieldByProperty: FieldByProperty<TValues> = {}
) {
  const items = toApiError(error).errors;
  const generalMessages = items.filter(item => !isFieldError(item)).map(item => item.details);

  items.filter(isFieldError).forEach(item =>
    form.setError(fieldByProperty[item.property] ?? (item.property as Path<TValues>), {
      type: "server",
      message: item.details,
    })
  );

  if (generalMessages.length > 0) {
    toast.error(generalMessages.join(" "));
  }
}
