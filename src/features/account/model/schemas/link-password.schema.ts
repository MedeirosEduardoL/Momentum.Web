import { z } from "zod";
import { newPasswordSchema } from "@/shared/lib/field-schemas";

export const linkPasswordSchema = z.object({
  password: newPasswordSchema,
});

export type LinkPasswordFormValues = z.infer<typeof linkPasswordSchema>;
