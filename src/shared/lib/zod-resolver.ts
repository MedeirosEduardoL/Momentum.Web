import {
  set,
  type FieldError,
  type FieldErrors,
  type FieldValues,
  type Resolver,
} from "react-hook-form";
import type { z } from "zod";

const FORM_LEVEL_FIELD = "root";

function toFieldErrors<TValues extends FieldValues>(issues: z.core.$ZodIssue[]) {
  const firstErrorByField = new Map<string, FieldError>();

  issues.forEach(issue => {
    const field = issue.path.join(".") || FORM_LEVEL_FIELD;

    if (!firstErrorByField.has(field)) {
      firstErrorByField.set(field, { type: issue.code, message: issue.message });
    }
  });

  const errors: FieldErrors<TValues> = {};
  firstErrorByField.forEach((error, field) => set(errors, field, error));

  return errors;
}

export function zodResolver<TValues extends FieldValues>(
  schema: z.ZodType<TValues>
): Resolver<TValues> {
  return values => {
    const result = schema.safeParse(values);

    if (result.success) {
      return { values: result.data, errors: {} };
    }

    return { values: {}, errors: toFieldErrors<TValues>(result.error.issues) };
  };
}
