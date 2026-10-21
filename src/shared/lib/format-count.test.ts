import { describe, expect, it } from "vitest";
import { formatCount } from "./format-count";

describe("formatCount", () => {
  it.each([
    [0, "card", "0 cards"],
    [1, "card", "1 card"],
    [2, "card", "2 cards"],
    [1, "feature", "1 feature"],
    [250, "segundo", "250 segundos"],
  ])("%i %s → %s", (quantity, noun, expected) => {
    expect(formatCount(quantity, noun)).toBe(expected);
  });
});
