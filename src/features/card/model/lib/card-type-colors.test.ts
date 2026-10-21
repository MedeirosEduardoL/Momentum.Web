import { describe, expect, it } from "vitest";
import { CARD_TYPE_EDGE_CLASSES, CARD_TYPE_MARK_CLASSES } from "./card-type-colors";

describe("card-type-colors", () => {
  it("usa o token do tipo na marca e na borda do cartão", () => {
    expect(CARD_TYPE_MARK_CLASSES).toEqual({
      user_story: "bg-type-user-story",
      spike: "bg-type-spike",
      issue: "bg-type-issue",
      tech_debt: "bg-type-tech-debt",
    });
    expect(CARD_TYPE_EDGE_CLASSES).toEqual({
      user_story: "border-l-type-user-story",
      spike: "border-l-type-spike",
      issue: "border-l-type-issue",
      tech_debt: "border-l-type-tech-debt",
    });
  });
});
