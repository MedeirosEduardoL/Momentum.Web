import { z } from "zod";
import { emailSchema } from "@/shared/lib/field-schemas";

export const emailRequestSchema = z.object({
  email: emailSchema,
});

export type EmailRequestFormValues = z.infer<typeof emailRequestSchema>;
