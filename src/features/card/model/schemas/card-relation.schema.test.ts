import { describe, expect, it } from "vitest";
import { cardRelationSchema } from "./card-relation.schema";

const validValues = { relation: "blocks", relatedCardId: "card-2" };

describe("cardRelationSchema", () => {
  it.each(["related", "blocks", "blocked_by", "duplicate_of", "duplicated_by"])(
    "aceita a relação %j",
    relation => {
      expect(cardRelationSchema.safeParse({ ...validValues, relation }).success).toBe(true);
    }
  );

  it.each(["", "parent_of", "BLOCKS"])("recusa a relação %j", relation => {
    expect(cardRelationSchema.safeParse({ ...validValues, relation }).success).toBe(false);
  });

  it("exige a escolha do outro card", () => {
    const result = cardRelationSchema.safeParse({ ...validValues, relatedCardId: "" });

    expect(result.error?.issues[0].message).toBe("Escolha o card.");
  });
});
