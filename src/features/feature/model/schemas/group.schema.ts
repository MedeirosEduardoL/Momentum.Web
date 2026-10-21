import { z } from "zod";

export const GROUP_LIMITS = {
  title: 200,
  description: 50_000,
} as const;

export const groupSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Informe o título.")
    .max(GROUP_LIMITS.title, "O título pode ter no máximo 200 caracteres."),
  description: z
    .string()
    .max(GROUP_LIMITS.description, "A descrição pode ter no máximo 50.000 caracteres."),
});

export type GroupFormValues = z.infer<typeof groupSchema>;
