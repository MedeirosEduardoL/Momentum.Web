import { z } from "zod";
import { CARD_STATE_CATEGORIES } from "../lib/card-options";

export const CARD_STATE_NAME_LIMIT = 60;

export const cardStateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do estado.")
    .max(
      CARD_STATE_NAME_LIMIT,
      `O nome do estado pode ter no máximo ${CARD_STATE_NAME_LIMIT} caracteres.`
    ),
  category: z.enum(CARD_STATE_CATEGORIES),
});

export type CardStateFormValues = z.infer<typeof cardStateSchema>;
