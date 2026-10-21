import { describe, expect, it } from "vitest";
import type { CardInterview, CardInterviewRound } from "../types/card-interview.types";
import {
  findAnswer,
  hasAnsweredRound,
  isLastRound,
  listReadableRounds,
  nextInterviewStep,
  shouldRequestProposal,
} from "./card-interview-progress";

const question = { title: "Quem usa o filtro?", body: "", recommendedAnswer: "O P.O." };

function round(number: number, answers: CardInterviewRound["answers"]): CardInterviewRound {
  return { number, questions: [question, question], answers };
}

function interviewWith(rounds: CardInterviewRound[], isFinished = false): CardInterview {
  return {
    id: "interview-1",
    cardId: "card-1",
    status: "open",
    startedBy: { userId: "user-1", name: "Ana Souza" },
    isFinished,
    rounds,
    createdAt: "2026-10-13T12:00:00Z",
    closedAt: null,
  };
}

const answered = round(1, [{ question: 2, answer: "Sim." }]);
const pending = round(2, null);
const closingRound: CardInterviewRound = { number: 3, questions: [], answers: null };
const tenAnsweredRounds = Array.from({ length: 10 }, (_item, position) =>
  round(position + 1, [{ question: 1, answer: "Sim." }])
);

describe("nextInterviewStep", () => {
  it("pede a primeira rodada na entrevista que ainda não tem nenhuma", () => {
    expect(nextInterviewStep(interviewWith([]))).toEqual({ kind: "ask" });
  });

  it("espera as respostas da última rodada quando ela ainda não foi respondida", () => {
    expect(nextInterviewStep(interviewWith([answered, pending]))).toEqual({
      kind: "answer",
      round: pending,
    });
  });

  it("pede a rodada seguinte quando as respostas já foram gravadas e a rodada não veio", () => {
    expect(nextInterviewStep(interviewWith([answered]))).toEqual({ kind: "ask" });
  });

  it("termina quando a IA devolve uma rodada sem pergunta", () => {
    expect(nextInterviewStep(interviewWith([answered, closingRound], true))).toEqual({
      kind: "finished",
    });
  });

  it("para no limite de 10 rodadas, depois de a décima ser respondida", () => {
    expect(nextInterviewStep(interviewWith(tenAnsweredRounds))).toEqual({ kind: "round-limit" });
  });

  it("ainda espera as respostas da décima rodada", () => {
    const tenth = round(10, null);

    expect(nextInterviewStep(interviewWith([...tenAnsweredRounds.slice(0, 9), tenth]))).toEqual({
      kind: "answer",
      round: tenth,
    });
  });
});

describe("listReadableRounds", () => {
  it("mostra ao time todas as rodadas com pergunta, inclusive a que espera resposta", () => {
    expect(listReadableRounds(interviewWith([answered, pending]), false)).toEqual([
      answered,
      pending,
    ]);
  });

  it("tira da leitura a rodada que quem conduz está respondendo no formulário", () => {
    expect(listReadableRounds(interviewWith([answered, pending]), true)).toEqual([answered]);
  });

  it("não mostra como rodada a que veio sem pergunta para encerrar", () => {
    expect(listReadableRounds(interviewWith([answered, closingRound], true), true)).toEqual([
      answered,
    ]);
  });
});

describe("hasAnsweredRound", () => {
  it("só libera a proposta depois de uma rodada respondida", () => {
    expect(hasAnsweredRound(interviewWith([]))).toBe(false);
    expect(hasAnsweredRound(interviewWith([pending]))).toBe(false);
    expect(hasAnsweredRound(interviewWith([answered, pending]))).toBe(true);
  });
});

describe("shouldRequestProposal", () => {
  const reply = [{ question: 1, answer: "Sim." }];

  it("pede a proposta quando a rodada que chegou termina a entrevista e há resposta", () => {
    expect(shouldRequestProposal(interviewWith([pending]), reply, closingRound)).toBe(true);
    expect(shouldRequestProposal(interviewWith([answered]), [], closingRound)).toBe(true);
  });

  it("não pede quando a rodada ainda traz pergunta", () => {
    expect(shouldRequestProposal(interviewWith([pending]), reply, round(3, null))).toBe(false);
  });

  it("não pede quando a IA termina sem nenhuma resposta da pessoa", () => {
    expect(shouldRequestProposal(interviewWith([]), [], closingRound)).toBe(false);
  });
});

describe("isLastRound e findAnswer", () => {
  it("reconhece a décima rodada como a última", () => {
    expect(isLastRound(round(9, null))).toBe(false);
    expect(isLastRound(round(10, null))).toBe(true);
  });

  it("acha a resposta pelo número da pergunta, e nada para a que ficou sem resposta", () => {
    expect(findAnswer(answered, 2)).toBe("Sim.");
    expect(findAnswer(answered, 1)).toBeNull();
    expect(findAnswer(pending, 1)).toBeNull();
  });
});
