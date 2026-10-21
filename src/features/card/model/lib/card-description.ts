import { formatDate } from "@/shared/lib/format-date";
import type { Card, CardSummary, RelatedCard } from "../types/card.types";
import { CARD_TYPE_LABELS } from "./card-options";

const SEPARATOR = " · ";

type TaskCount = Pick<CardSummary, "taskCount" | "doneTaskCount">;

export function describeRelatedCard({ type, stateName }: RelatedCard) {
  return [CARD_TYPE_LABELS[type], stateName].join(SEPARATOR);
}

export function describeTaskProgress({ taskCount, doneTaskCount }: TaskCount) {
  return taskCount === 1
    ? `${doneTaskCount} de 1 subitem concluído`
    : `${doneTaskCount} de ${taskCount} subitens concluídos`;
}

export function describeCardProgress(card: CardSummary) {
  const tasks = card.taskCount === 0 ? [] : [describeTaskProgress(card)];

  return [`Progresso de ${card.progress}%`, ...tasks].join(SEPARATOR);
}

export function describeCardDates({ createdAt, updatedAt }: Card) {
  return [`Criado em ${formatDate(createdAt)}`, `Alterado em ${formatDate(updatedAt)}`].join(
    SEPARATOR
  );
}
