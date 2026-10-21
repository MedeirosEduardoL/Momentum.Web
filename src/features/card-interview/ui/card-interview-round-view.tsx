import { MarkdownContent } from "@/shared/ui/markdown-content";
import { findAnswer } from "../model/lib/card-interview-progress";
import type { CardInterviewRound } from "../model/types/card-interview.types";
import { CardInterviewQuestion } from "./card-interview-question";

type CardInterviewRoundViewProps = {
  round: CardInterviewRound;
};

type RoundAnswerProps = {
  round: CardInterviewRound;
  question: number;
};

function RoundAnswer({ round, question }: RoundAnswerProps) {
  const answer = findAnswer(round, question);

  if (answer === null) {
    return (
      <p className="text-sm text-ink-subtle">
        {round.answers === null ? "Aguardando a resposta." : "Sem resposta."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-ink-subtle">Resposta</span>
      <MarkdownContent content={answer} showsLinkDestination />
    </div>
  );
}

export function CardInterviewRoundView({ round }: CardInterviewRoundViewProps) {
  return (
    <li className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-ink-muted">
        Rodada {round.number} · perguntas da IA
      </h3>
      <ol className="flex flex-col gap-4">
        {round.questions.map((question, position) => (
          <li key={`${position}-${question.title}`} className="flex flex-col gap-2">
            <CardInterviewQuestion number={position + 1} question={question} />
            <RoundAnswer round={round} question={position + 1} />
          </li>
        ))}
      </ol>
    </li>
  );
}
