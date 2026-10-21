import type { CardState, CardStateCategory, CardSummary } from "../types/card.types";

const DONE: CardStateCategory = "done";

function concludes(card: CardSummary, state: CardState | undefined) {
  return state?.category === DONE && state.id !== card.state.id;
}

export function countTasksClosedBy(card: CardSummary, state: CardState | undefined) {
  return concludes(card, state) ? card.taskCount - card.doneTaskCount : 0;
}

export function describeTasksClosedBy(openTaskCount: number) {
  return openTaskCount === 1
    ? "O card tem 1 subitem aberto, que será concluído."
    : `O card tem ${openTaskCount} subitens abertos, que serão concluídos.`;
}
