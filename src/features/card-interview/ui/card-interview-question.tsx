import { MarkdownContent } from "@/shared/ui/markdown-content";
import type { CardInterviewQuestion as Question } from "../model/types/card-interview.types";

type CardInterviewQuestionProps = {
  number: number;
  question: Question;
};

export function CardInterviewQuestion({ number, question }: CardInterviewQuestionProps) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-medium">
        {number}. {question.title}
      </h4>
      {question.body && <MarkdownContent content={question.body} showsLinkDestination />}
      {question.recommendedAnswer && (
        <div className="flex flex-col gap-1 border-l-2 border-line-strong pl-3">
          <span className="text-xs font-medium text-ink-subtle">Recomendação da IA</span>
          <MarkdownContent
            content={question.recommendedAnswer}
            className="text-ink-muted"
            showsLinkDestination
          />
        </div>
      )}
    </div>
  );
}
