import { describe, expect, it } from "vitest";
import { cardSchema, type CardFormValues } from "./card.schema";

const validValues: CardFormValues = {
  cardType: "user_story",
  title: " Filtrar cards por responsável ",
  description: "Como P.O, quero filtrar a lista.",
  cardStateId: "state-1",
  priority: "medium",
  assigneeId: "",
  featureId: "",
  userStory: { acceptanceCriteria: [{ text: " Mostra só os cards da pessoa " }] },
  spike: { question: "", deadline: "", conclusion: "" },
  issue: {
    stepsToReproduce: "",
    expectedBehavior: "",
    observedBehavior: "",
    severity: "",
    location: "",
  },
  techDebt: { impact: "" },
};

function firstMessage(values: unknown) {
  return cardSchema.safeParse(values).error?.issues[0].message;
}

describe("cardSchema", () => {
  it("tira os espaços do título e dos critérios de aceite", () => {
    const parsed = cardSchema.parse(validValues);

    expect(parsed.title).toBe("Filtrar cards por responsável");
    expect(parsed.userStory.acceptanceCriteria).toEqual([{ text: "Mostra só os cards da pessoa" }]);
  });

  it("mantém a descrição como foi escrita", () => {
    const description = "  Primeira linha\n\n    código recuado\n";

    expect(cardSchema.parse({ ...validValues, description }).description).toBe(description);
  });

  it("exige o título do card", () => {
    expect(firstMessage({ ...validValues, title: "  " })).toBe("Informe o título do card.");
  });

  it("limita o título a 200 caracteres", () => {
    expect(firstMessage({ ...validValues, title: "a".repeat(201) })).toBe(
      "O título do card pode ter no máximo 200 caracteres."
    );
    expect(cardSchema.safeParse({ ...validValues, title: "a".repeat(200) }).success).toBe(true);
  });

  it("limita a descrição a 50.000 caracteres", () => {
    expect(firstMessage({ ...validValues, description: "a".repeat(50_001) })).toBe(
      "A descrição do card pode ter no máximo 50.000 caracteres."
    );
  });

  it.each(["user_story", "spike", "issue", "tech_debt"])("aceita o tipo de card %j", cardType => {
    expect(cardSchema.safeParse({ ...validValues, cardType }).success).toBe(true);
  });

  it("recusa tipo de card e prioridade fora do contrato", () => {
    expect(cardSchema.safeParse({ ...validValues, cardType: "bug" }).success).toBe(false);
    expect(cardSchema.safeParse({ ...validValues, priority: "highest" }).success).toBe(false);
  });

  it("limita cada critério de aceite a 500 caracteres", () => {
    const values = {
      ...validValues,
      userStory: { acceptanceCriteria: [{ text: "ok" }, { text: "a".repeat(501) }] },
    };
    const issue = cardSchema.safeParse(values).error?.issues[0];

    expect(issue?.message).toBe("Um critério de aceite pode ter no máximo 500 caracteres.");
    expect(issue?.path).toEqual(["userStory", "acceptanceCriteria", 1, "text"]);
  });

  it("limita a user story a 50 critérios de aceite", () => {
    const acceptanceCriteria = Array.from({ length: 51 }, () => ({ text: "critério" }));
    const issue = cardSchema.safeParse({ ...validValues, userStory: { acceptanceCriteria } }).error
      ?.issues[0];

    expect(issue?.message).toBe("Um card pode ter no máximo 50 critérios de aceite.");
    expect(issue?.path).toEqual(["userStory", "acceptanceCriteria"]);
  });

  it.each([
    ["spike", "question"],
    ["spike", "conclusion"],
    ["issue", "stepsToReproduce"],
    ["issue", "expectedBehavior"],
    ["issue", "observedBehavior"],
    ["techDebt", "impact"],
  ] as const)("limita %s.%s a 10.000 caracteres", (group, field) => {
    const values = {
      ...validValues,
      [group]: { ...validValues[group], [field]: "a".repeat(10_001) },
    };
    const issue = cardSchema.safeParse(values).error?.issues[0];

    expect(issue?.message).toBe("Este campo pode ter no máximo 10.000 caracteres.");
    expect(issue?.path).toEqual([group, field]);
  });

  it("limita o local da issue a 200 caracteres", () => {
    const values = { ...validValues, issue: { ...validValues.issue, location: "a".repeat(201) } };

    expect(firstMessage(values)).toBe("O local pode ter no máximo 200 caracteres.");
  });

  it.each(["", "critical", "high", "medium", "low"])("aceita a severidade %j", severity => {
    const values = { ...validValues, issue: { ...validValues.issue, severity } };

    expect(cardSchema.safeParse(values).success).toBe(true);
  });

  it("recusa severidade fora do contrato", () => {
    const values = { ...validValues, issue: { ...validValues.issue, severity: "blocker" } };

    expect(cardSchema.safeParse(values).success).toBe(false);
  });
});
