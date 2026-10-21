import { useForm } from "react-hook-form";
import { zodResolver } from "@/shared/lib/zod-resolver";
import {
  roundAnswersSchema,
  toRoundAnswers,
  type RoundAnswersFormValues,
} from "../schemas/round-answers.schema";
import type { CardInterviewAnswer, CardInterviewRound } from "../types/card-interview.types";

const roundAnswersResolver = zodResolver(roundAnswersSchema);

export function useAnswerCardInterviewRound(
  round: CardInterviewRound,
  onAnswer: (answers: CardInterviewAnswer[]) => Promise<void>
) {
  const form = useForm<RoundAnswersFormValues>({
    resolver: roundAnswersResolver,
    defaultValues: { answers: round.questions.map(() => "") },
  });

  const followRecommendation = (position: number) =>
    form.setValue(`answers.${position}`, round.questions[position].recommendedAnswer, {
      shouldDirty: true,
      shouldValidate: true,
    });

  return {
    form,
    onSubmit: form.handleSubmit(values => onAnswer(toRoundAnswers(values))),
    followRecommendation,
  };
}
