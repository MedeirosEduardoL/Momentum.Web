import { z } from "zod";
import { emailSchema } from "@/shared/lib/field-schemas";

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a sua senha."),
});

export type SignInFormValues = z.infer<typeof signInSchema>;
