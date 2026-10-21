import { describe, expect, it } from "vitest";
import { roundAnswersSchema, toRoundAnswers } from "./round-answers.schema";

describe("roundAnswersSchema", () => {
  it("aceita a rodada com uma pergunta respondida e as outras em branco", () => {
    const result = roundAnswersSchema.safeParse({ answers: ["", "  Sim, na URL.  ", ""] });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ answers: ["", "Sim, na URL.", ""] });
  });

  it("pede ao menos uma resposta, e não conta a que só tem espaço", () => {
    const result = roundAnswersSchema.safeParse({ answers: ["", "   "] });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: [],
      message: "Responda a pelo menos uma pergunta da rodada.",
    });
  });

  it("aceita a resposta com 2.000 caracteres e recusa a que passa disso, na pergunta certa", () => {
    expect(roundAnswersSchema.safeParse({ answers: ["a".repeat(2000)] }).success).toBe(true);

    const result = roundAnswersSchema.safeParse({ answers: ["Sim.", "a".repeat(2001)] });

    expect(result.error?.issues[0]).toMatchObject({
      path: ["answers", 1],
      message: "A resposta pode ter até 2.000 caracteres.",
    });
  });

  it("mantém as quebras de linha da resposta", () => {
    const result = roundAnswersSchema.safeParse({ answers: ["Primeiro.\n\nDepois."] });

    expect(result.data?.answers[0]).toBe("Primeiro.\n\nDepois.");
  });
});

describe("toRoundAnswers", () => {
  it("numera as respostas pela posição da pergunta e deixa de fora as em branco", () => {
    expect(toRoundAnswers({ answers: ["", "Sim, na URL.", "", "Só o P.O."] })).toEqual([
      { question: 2, answer: "Sim, na URL." },
      { question: 4, answer: "Só o P.O." },
    ]);
  });
});
