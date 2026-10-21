import { describe, expect, it } from "vitest";
import { proposalDecisionSchema } from "./proposal-decision.schema";

describe("proposalDecisionSchema", () => {
  it("aceita uma ou mais mudanças escolhidas", () => {
    expect(proposalDecisionSchema.safeParse({ fields: ["description"] }).success).toBe(true);
    expect(
      proposalDecisionSchema.safeParse({ fields: ["description", "acceptance_criteria"] }).success
    ).toBe(true);
  });

  it("pede ao menos uma mudança para aplicar", () => {
    const result = proposalDecisionSchema.safeParse({ fields: [] });

    expect(result.error?.issues[0]).toMatchObject({
      path: ["fields"],
      message: "Escolha ao menos uma mudança para aplicar.",
    });
  });
});
