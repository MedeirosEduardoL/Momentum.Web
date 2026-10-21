import { describe, expect, it } from "vitest";
import { cardTaskDetailsSchema, cardTaskSchema } from "./card-task.schema";

const validValues = { kind: "task", title: " Escrever o teste do filtro ", assigneeId: "user-1" };

describe("cardTaskSchema", () => {
  it("tira os espaços do título e mantém o tipo e o responsável escolhidos", () => {
    expect(cardTaskSchema.parse(validValues)).toEqual({
      kind: "task",
      title: "Escrever o teste do filtro",
      assigneeId: "user-1",
    });
  });

  it("aceita o bug sem responsável", () => {
    expect(cardTaskSchema.safeParse({ ...validValues, kind: "bug", assigneeId: "" }).success).toBe(
      true
    );
  });

  it("recusa um tipo que não é task nem bug", () => {
    expect(cardTaskSchema.safeParse({ ...validValues, kind: "epic" }).success).toBe(false);
  });

  it("exige o título do subitem", () => {
    const result = cardTaskSchema.safeParse({ ...validValues, title: " " });

    expect(result.error?.issues[0].message).toBe("Informe o título do subitem.");
  });

  it("limita o título do subitem a 200 caracteres", () => {
    const result = cardTaskSchema.safeParse({ ...validValues, title: "a".repeat(201) });

    expect(result.error?.issues[0].message).toBe(
      "O título do subitem pode ter no máximo 200 caracteres."
    );
  });
});

describe("cardTaskDetailsSchema", () => {
  it("valida o título com as mesmas regras e aceita a descrição vazia", () => {
    expect(cardTaskDetailsSchema.parse({ title: " Revisar ", description: "" })).toEqual({
      title: "Revisar",
      description: "",
    });
  });

  it("limita a descrição a 50.000 caracteres", () => {
    const result = cardTaskDetailsSchema.safeParse({
      title: "Revisar",
      description: "a".repeat(50_001),
    });

    expect(result.error?.issues[0].message).toBe(
      "A descrição do subitem pode ter no máximo 50.000 caracteres."
    );
  });
});
