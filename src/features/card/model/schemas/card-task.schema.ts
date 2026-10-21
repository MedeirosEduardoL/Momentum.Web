import { z } from "zod";
import { CARD_TASK_KINDS } from "../lib/card-options";

export const CARD_TASK_LIMITS = {
  title: 200,
  description: 50_000,
  tasksPerCard: 100,
} as const;

const titleSchema = z
  .string()
  .trim()
  .min(1, "Informe o título do subitem.")
  .max(CARD_TASK_LIMITS.title, "O título do subitem pode ter no máximo 200 caracteres.");

export const cardTaskSchema = z.object({
  kind: z.enum(CARD_TASK_KINDS),
  title: titleSchema,
  assigneeId: z.string(),
});

export const cardTaskDetailsSchema = z.object({
  title: titleSchema,
  description: z
    .string()
    .max(
      CARD_TASK_LIMITS.description,
      "A descrição do subitem pode ter no máximo 50.000 caracteres."
    ),
});

export type CardTaskFormValues = z.infer<typeof cardTaskSchema>;
export type CardTaskDetailsFormValues = z.infer<typeof cardTaskDetailsSchema>;
