import { z } from "zod";
import { CARD_PRIORITIES, CARD_TYPES, ISSUE_SEVERITIES } from "../lib/card-options";

export const NO_SEVERITY = "";

export const CARD_LIMITS = {
  title: 200,
  description: 50_000,
  typeText: 10_000,
  location: 200,
  acceptanceCriterion: 500,
  acceptanceCriteria: 50,
  search: 100,
} as const;

const typeText = z
  .string()
  .trim()
  .max(CARD_LIMITS.typeText, "Este campo pode ter no máximo 10.000 caracteres.");

const acceptanceCriterion = z.object({
  text: z
    .string()
    .trim()
    .max(
      CARD_LIMITS.acceptanceCriterion,
      "Um critério de aceite pode ter no máximo 500 caracteres."
    ),
});

export const cardSchema = z.object({
  cardType: z.enum(CARD_TYPES),
  title: z
    .string()
    .trim()
    .min(1, "Informe o título do card.")
    .max(CARD_LIMITS.title, "O título do card pode ter no máximo 200 caracteres."),
  description: z
    .string()
    .max(CARD_LIMITS.description, "A descrição do card pode ter no máximo 50.000 caracteres."),
  cardStateId: z.string(),
  priority: z.enum(CARD_PRIORITIES),
  assigneeId: z.string(),
  featureId: z.string(),
  userStory: z.object({
    acceptanceCriteria: z
      .array(acceptanceCriterion)
      .max(CARD_LIMITS.acceptanceCriteria, "Um card pode ter no máximo 50 critérios de aceite."),
  }),
  spike: z.object({
    question: typeText,
    deadline: z.string(),
    conclusion: typeText,
  }),
  issue: z.object({
    stepsToReproduce: typeText,
    expectedBehavior: typeText,
    observedBehavior: typeText,
    severity: z.enum([NO_SEVERITY, ...ISSUE_SEVERITIES]),
    location: z
      .string()
      .trim()
      .max(CARD_LIMITS.location, "O local pode ter no máximo 200 caracteres."),
  }),
  techDebt: z.object({
    impact: typeText,
  }),
});

export const quickCardSchema = cardSchema.pick({ cardType: true, title: true });

export type CardFormValues = z.infer<typeof cardSchema>;
export type QuickCardFormValues = z.infer<typeof quickCardSchema>;
