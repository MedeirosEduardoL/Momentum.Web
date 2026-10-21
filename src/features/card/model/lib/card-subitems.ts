import type { CardSubitemCount, CardSubitemCounts, CardTaskKind } from "../types/card.types";
import { CARD_TASK_KINDS } from "./card-options";

export function listPresentKinds(counts: CardSubitemCounts): CardTaskKind[] {
  return CARD_TASK_KINDS.filter(kind => counts[kind].total > 0);
}

export function isOpenImpediment(kind: CardTaskKind, { total, done }: CardSubitemCount) {
  return kind === "impediment" && done < total;
}

export function describeSubitemCount({ total, done }: CardSubitemCount) {
  return `${done}/${total}`;
}
