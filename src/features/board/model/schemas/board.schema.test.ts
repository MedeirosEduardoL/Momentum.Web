import { describe, expect, it } from "vitest";
import { boardSchema, type BoardFormValues } from "./board.schema";

const validValues: BoardFormValues = {
  name: "Issues urgentes",
  cardTypes: ["issue"],
  priorities: ["urgent", "high"],
  assigneeIds: ["user-1"],
  featureIds: ["feature-1"],
  epicIds: ["epic-1"],
};

const MAX_VALUES = 50;

function ids(quantity: number) {
  return Array.from({ length: quantity }, (_unused, index) => `id-${index}`);
}

function messageOf(values: unknown) {
  const result = boardSchema.safeParse(values);

  return result.success ? null : result.error.issues[0].message;
}

describe("boardSchema", () => {
  it("aceita o nome com os cinco critérios", () => {
    expect(boardSchema.parse(validValues)).toEqual(validValues);
  });

  it("aceita o board sem nenhum critério, que mostra todos os cards", () => {
    const unfiltered = {
      name: "Todos os cards",
      cardTypes: [],
      priorities: [],
      assigneeIds: [],
      featureIds: [],
      epicIds: [],
    };

    expect(boardSchema.parse(unfiltered)).toEqual(unfiltered);
  });

  it("tira os espaços em volta do nome", () => {
    expect(boardSchema.parse({ ...validValues, name: "  Sprint atual " }).name).toBe(
      "Sprint atual"
    );
  });

  it.each(["", "   "])("pede o nome quando ele vem como %j", name => {
    expect(messageOf({ ...validValues, name })).toBe("Informe o nome do board.");
  });

  it("aceita o nome com 80 caracteres e recusa com 81", () => {
    expect(messageOf({ ...validValues, name: "a".repeat(80) })).toBeNull();
    expect(messageOf({ ...validValues, name: "a".repeat(81) })).toBe(
      "O nome do board pode ter no máximo 80 caracteres."
    );
  });

  it("recusa tipo de card e prioridade que não são do contrato", () => {
    expect(messageOf({ ...validValues, cardTypes: ["bug"] })).not.toBeNull();
    expect(messageOf({ ...validValues, priorities: ["critical"] })).not.toBeNull();
  });

  it.each([
    ["assigneeIds", "Escolha no máximo 50 responsáveis."],
    ["featureIds", "Escolha no máximo 50 features."],
    ["epicIds", "Escolha no máximo 50 epics."],
  ] as const)("aceita 50 valores em %s e recusa o 51º", (criterion, message) => {
    expect(messageOf({ ...validValues, [criterion]: ids(MAX_VALUES) })).toBeNull();
    expect(messageOf({ ...validValues, [criterion]: ids(MAX_VALUES + 1) })).toBe(message);
  });
});
