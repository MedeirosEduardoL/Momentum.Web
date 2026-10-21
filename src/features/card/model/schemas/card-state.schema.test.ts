import { describe, expect, it } from "vitest";
import { cardStateSchema } from "./card-state.schema";

const validValues = { name: " Em revisão ", category: "in_progress" };

describe("cardStateSchema", () => {
  it("tira os espaços do nome e mantém a categoria escolhida", () => {
    expect(cardStateSchema.parse(validValues)).toEqual({
      name: "Em revisão",
      category: "in_progress",
    });
  });

  it("exige o nome do estado", () => {
    const result = cardStateSchema.safeParse({ ...validValues, name: " " });

    expect(result.error?.issues[0].message).toBe("Informe o nome do estado.");
  });

  it("limita o nome do estado a 60 caracteres", () => {
    const result = cardStateSchema.safeParse({ ...validValues, name: "a".repeat(61) });

    expect(result.error?.issues[0].message).toBe(
      "O nome do estado pode ter no máximo 60 caracteres."
    );
  });

  it("recusa categoria fora das quatro do Core", () => {
    expect(cardStateSchema.safeParse({ ...validValues, category: "blocked" }).success).toBe(false);
  });
});
