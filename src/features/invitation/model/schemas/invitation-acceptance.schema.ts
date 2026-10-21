import { z } from "zod";
import { newPasswordSchema, personNameSchema } from "@/shared/lib/field-schemas";

export const newAccountAcceptanceSchema = z.object({
  name: personNameSchema,
  password: newPasswordSchema,
});

export const existingAccountAcceptanceSchema = z.object({
  name: z.string(),
  password: z.string().min(1, "Informe a senha da sua conta."),
});

export type InvitationAcceptanceFormValues = z.infer<typeof newAccountAcceptanceSchema>;
