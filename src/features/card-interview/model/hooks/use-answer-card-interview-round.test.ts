import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CardInterviewAnswer, CardInterviewRound } from "../types/card-interview.types";
import { useAnswerCardInterviewRound } from "./use-answer-card-interview-round";

const round: CardInterviewRound = {
  number: 1,
  questions: [
    { title: "Quem usa o filtro?", body: "", recommendedAnswer: "O P.O, ao revisar o backlog." },
    { title: "O filtro fica na URL?", body: "", recommendedAnswer: "Sim." },
  ],
  answers: null,
};
const onAnswer = vi.fn<(answers: CardInterviewAnswer[]) => Promise<void>>();

function renderAnswers() {
  return renderHook(() => {
    const answering = useAnswerCardInterviewRound(round, onAnswer);

    return { ...answering, errors: answering.form.formState.errors };
  });
}

beforeEach(() => {
  onAnswer.mockReset().mockResolvedValue(undefined);
});

describe("useAnswerCardInterviewRound", () => {
  it("começa com uma resposta em branco para cada pergunta da rodada", () => {
    const { result } = renderAnswers();

    expect(result.current.form.getValues("answers")).toEqual(["", ""]);
  });

  it("entrega só as perguntas respondidas, com o número de cada uma", async () => {
    const { result } = renderAnswers();

    await act(async () => {
      result.current.form.setValue("answers.1", "  Sim, com os filtros na URL.  ");
      await result.current.onSubmit();
    });

    expect(onAnswer).toHaveBeenCalledWith([{ question: 2, answer: "Sim, com os filtros na URL." }]);
  });

  it("preenche a resposta com a recomendação da IA, que a pessoa ainda pode editar", async () => {
    const { result } = renderAnswers();

    await act(async () => {
      result.current.followRecommendation(0);
      await result.current.onSubmit();
    });

    expect(result.current.form.getValues("answers.0")).toBe("O P.O, ao revisar o backlog.");
    expect(onAnswer).toHaveBeenCalledWith([
      { question: 1, answer: "O P.O, ao revisar o backlog." },
    ]);
  });

  it("não pede a rodada sem nenhuma resposta e diz o que falta", async () => {
    const { result } = renderAnswers();

    await act(() => result.current.onSubmit());

    expect(onAnswer).not.toHaveBeenCalled();
    expect(result.current.errors.root?.message).toBe(
      "Responda a pelo menos uma pergunta da rodada."
    );
  });

  it("aponta a resposta que passa de 2.000 caracteres", async () => {
    const { result } = renderAnswers();

    await act(async () => {
      result.current.form.setValue("answers.0", "a".repeat(2001));
      await result.current.onSubmit();
    });

    expect(onAnswer).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("answers.0").error?.message).toBe(
      "A resposta pode ter até 2.000 caracteres."
    );
  });
});
