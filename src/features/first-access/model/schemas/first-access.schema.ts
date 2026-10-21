import { z } from "zod";

const NAME_MAX_LENGTH = 120;

export const firstAccessSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(1, "Informe o nome da organização.")
    .max(NAME_MAX_LENGTH, "O nome da organização pode ter no máximo 120 caracteres."),
});

export type FirstAccessFormValues = z.infer<typeof firstAccessSchema>;
