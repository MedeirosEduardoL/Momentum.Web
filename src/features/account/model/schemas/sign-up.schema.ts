import { z } from "zod";
import { emailSchema, personNameSchema } from "@/shared/lib/field-schemas";

export const signUpSchema = z.object({
  name: personNameSchema,
  email: emailSchema,
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;
