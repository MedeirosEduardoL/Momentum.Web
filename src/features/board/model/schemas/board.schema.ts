import { z } from "zod";
import { CARD_PRIORITIES, CARD_TYPES } from "@/features/card";

export const BOARD_LIMITS = {
  name: 80,
  criterionValues: 50,
} as const;

function references(tooManyMessage: string) {
  return z.array(z.string()).max(BOARD_LIMITS.criterionValues, tooManyMessage);
}

export const boardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do board.")
    .max(BOARD_LIMITS.name, "O nome do board pode ter no máximo 80 caracteres."),
  cardTypes: z.array(z.enum(CARD_TYPES)),
  priorities: z.array(z.enum(CARD_PRIORITIES)),
  assigneeIds: references("Escolha no máximo 50 responsáveis."),
  featureIds: references("Escolha no máximo 50 features."),
  epicIds: references("Escolha no máximo 50 epics."),
});

export type BoardFormValues = z.infer<typeof boardSchema>;
