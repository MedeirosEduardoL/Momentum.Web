import { z } from "zod";
import { newPasswordSchema, personNameSchema } from "@/shared/lib/field-schemas";

export const emailVerificationSchema = z.object({
  name: personNameSchema,
  password: newPasswordSchema,
});

export type EmailVerificationFormValues = z.infer<typeof emailVerificationSchema>;
