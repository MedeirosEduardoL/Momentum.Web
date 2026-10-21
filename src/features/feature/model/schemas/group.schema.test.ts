import { describe, expect, it } from "vitest";
import { groupSchema } from "./group.schema";

const validValues = { title: " Filtros da lista ", description: "Por **tipo** e por estado.\n" };

describe("groupSchema", () => {
  it("tira os espaços do título e mantém a descrição como foi escrita", () => {
    expect(groupSchema.parse(validValues)).toEqual({
      title: "Filtros da lista",
      description: "Por **tipo** e por estado.\n",
    });
  });

  it("aceita a descrição vazia", () => {
    expect(groupSchema.safeParse({ ...validValues, description: "" }).success).toBe(true);
  });

  it("exige o título", () => {
    const result = groupSchema.safeParse({ ...validValues, title: "  " });

    expect(result.error?.issues[0].message).toBe("Informe o título.");
  });

  it("limita o título a 200 caracteres", () => {
    const result = groupSchema.safeParse({ ...validValues, title: "a".repeat(201) });

    expect(result.error?.issues[0].message).toBe("O título pode ter no máximo 200 caracteres.");
  });

  it("aceita o título com 200 caracteres", () => {
    expect(groupSchema.safeParse({ ...validValues, title: "a".repeat(200) }).success).toBe(true);
  });

  it("limita a descrição a 50.000 caracteres", () => {
    const result = groupSchema.safeParse({ ...validValues, description: "a".repeat(50_001) });

    expect(result.error?.issues[0].message).toBe(
      "A descrição pode ter no máximo 50.000 caracteres."
    );
  });

  it("não leva adiante campo que não é do formulário", () => {
    expect(groupSchema.parse({ ...validValues, id: "feature-1" })).not.toHaveProperty("id");
  });
});
