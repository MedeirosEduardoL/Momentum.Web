import { z } from "zod";
import { CARD_RELATIONS } from "../lib/card-options";

export const cardRelationSchema = z.object({
  relation: z.enum(CARD_RELATIONS),
  relatedCardId: z.string().min(1, "Escolha o card."),
});

export type CardRelationFormValues = z.infer<typeof cardRelationSchema>;
