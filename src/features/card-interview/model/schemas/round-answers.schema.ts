import { z } from "zod";
import { CARD_INTERVIEW_LIMITS } from "../lib/card-interview-progress";
import type { CardInterviewAnswer } from "../types/card-interview.types";

type RoundAnswers = {
  answers: string[];
};

function hasAnAnswer({ answers }: RoundAnswers) {
  return answers.some(answer => answer.length > 0);
}

export const roundAnswersSchema = z
  .object({
    answers: z.array(
      z
        .string()
        .trim()
        .max(CARD_INTERVIEW_LIMITS.answer, "A resposta pode ter até 2.000 caracteres.")
    ),
  })
  .refine(hasAnAnswer, "Responda a pelo menos uma pergunta da rodada.");

export type RoundAnswersFormValues = z.infer<typeof roundAnswersSchema>;

export function toRoundAnswers({ answers }: RoundAnswersFormValues): CardInterviewAnswer[] {
  return answers
    .map((answer, position) => ({ question: position + 1, answer }))
    .filter(({ answer }) => answer.length > 0);
}
