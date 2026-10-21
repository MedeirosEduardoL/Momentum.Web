import type { CardType } from "../types/card.types";

export const CARD_TYPE_MARK_CLASSES: Record<CardType, string> = {
  user_story: "bg-type-user-story",
  spike: "bg-type-spike",
  issue: "bg-type-issue",
  tech_debt: "bg-type-tech-debt",
};

export const CARD_TYPE_EDGE_CLASSES: Record<CardType, string> = {
  user_story: "border-l-type-user-story",
  spike: "border-l-type-spike",
  issue: "border-l-type-issue",
  tech_debt: "border-l-type-tech-debt",
};
