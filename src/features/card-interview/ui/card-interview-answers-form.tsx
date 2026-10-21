import { Button } from "@/shared/ui/button";
import { TextAreaField } from "@/shared/ui/text-area-field";
import { useAnswerCardInterviewRound } from "../model/hooks/use-answer-card-interview-round";
import { CARD_INTERVIEW_LIMITS, isLastRound } from "../model/lib/card-interview-progress";
import type { CardInterviewAnswer, CardInterviewRound } from "../model/types/card-interview.types";
import { CardInterviewQuestion } from "./card-interview-question";

type CardInterviewAnswersFormProps = {
  round: CardInterviewRound;
  isAsking: boolean;
  onAnswer: (answers: CardInterviewAnswer[]) => Promise<void>;
};

export function CardInterviewAnswersForm({
  round,
  isAsking,
  onAnswer,
}: CardInterviewAnswersFormProps) {
  const { form, onSubmit, followRecommendation } = useAnswerCardInterviewRound(round, onAnswer);
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <h3 className="text-sm font-medium text-ink-muted">
        Rodada {round.number} · perguntas da IA
      </h3>
      <ol className="flex flex-col gap-5">
        {round.questions.map((question, position) => (
          <li key={`${position}-${question.title}`} className="flex flex-col gap-2">
            <CardInterviewQuestion number={position + 1} question={question} />
            <TextAreaField
              label={`Sua resposta à pergunta ${position + 1}`}
              rows={3}
              maxLength={CARD_INTERVIEW_LIMITS.answer}
              readOnly={isAsking}
              error={errors.answers?.[position]?.message}
              {...form.register(`answers.${position}`)}
            />
            {question.recommendedAnswer && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                disabled={isAsking}
                onClick={() => followRecommendation(position)}
              >
                Usar a recomendação
              </Button>
            )}
          </li>
        ))}
      </ol>
      {errors.root?.message && (
        <p role="alert" className="text-sm text-danger">
          {errors.root.message}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" isLoading={isAsking}>
          {isLastRound(round) ? "Enviar respostas" : "Enviar respostas e pedir a próxima rodada"}
        </Button>
        <span className="text-sm text-ink-subtle">Não é preciso responder a todas.</span>
      </div>
    </form>
  );
}
