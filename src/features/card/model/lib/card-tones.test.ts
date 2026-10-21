import { describe, expect, it } from "vitest";
import {
  CARD_PRIORITY_TONES,
  CARD_STATE_CATEGORY_EDGE_CLASSES,
  CARD_STATE_CATEGORY_TONES,
  isHighlightedPriority,
} from "./card-tones";

describe("card-tones", () => {
  it("dá cor só ao que pede atenção: andamento, concluído, alta e urgente", () => {
    expect(CARD_STATE_CATEGORY_TONES).toEqual({
      to_do: "neutral",
      in_progress: "info",
      done: "success",
      cancelled: "neutral",
    });
    expect(CARD_PRIORITY_TONES).toEqual({
      low: "neutral",
      medium: "neutral",
      high: "warning",
      urgent: "danger",
    });
  });

  it("pinta o traço da coluna do board no tom da categoria do estado", () => {
    expect(CARD_STATE_CATEGORY_EDGE_CLASSES).toEqual({
      to_do: "border-t-line-strong",
      in_progress: "border-t-info",
      done: "border-t-success",
      cancelled: "border-t-line-strong",
    });
  });

  it("destaca só a prioridade alta e a urgente", () => {
    expect(isHighlightedPriority("urgent")).toBe(true);
    expect(isHighlightedPriority("high")).toBe(true);
    expect(isHighlightedPriority("medium")).toBe(false);
    expect(isHighlightedPriority("low")).toBe(false);
  });
});
