import type { BadgeTone } from "@/shared/ui/badge";
import type { CardPriority, CardStateCategory, CardTaskKind } from "../types/card.types";

export const CARD_STATE_CATEGORY_TONES: Record<CardStateCategory, BadgeTone> = {
  to_do: "neutral",
  in_progress: "info",
  done: "success",
  cancelled: "neutral",
};

export const CARD_PRIORITY_TONES: Record<CardPriority, BadgeTone> = {
  low: "neutral",
  medium: "neutral",
  high: "warning",
  urgent: "danger",
};

export const CARD_TASK_KIND_TONES: Record<CardTaskKind, BadgeTone> = {
  task: "neutral",
  bug: "danger",
  impediment: "warning",
};

export const CARD_STATE_CATEGORY_EDGE_CLASSES: Record<CardStateCategory, string> = {
  to_do: "border-t-line-strong",
  in_progress: "border-t-info",
  done: "border-t-success",
  cancelled: "border-t-line-strong",
};

export function isHighlightedPriority(priority: CardPriority) {
  return CARD_PRIORITY_TONES[priority] !== "neutral";
}
