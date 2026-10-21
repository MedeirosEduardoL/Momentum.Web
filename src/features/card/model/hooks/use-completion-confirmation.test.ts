import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CardState, CardSummary } from "../types/card.types";
import { useCompletionConfirmation } from "./use-completion-confirmation";

const doing: CardState = {
  id: "state-2",
  name: "Em andamento",
  category: "in_progress",
  position: 2,
};
const done: CardState = { id: "state-3", name: "Concluído", category: "done", position: 3 };
const states = [doing, done];

const card: CardSummary = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "user_story",
  title: "Filtro por responsável",
  state: doing,
  priority: "medium",
  assignee: null,
  featureId: null,
  progress: 40,
  taskCount: 5,
  doneTaskCount: 3,
  subitemCounts: {
    task: { total: 0, done: 0 },
    bug: { total: 0, done: 0 },
    impediment: { total: 0, done: 0 },
  },
  isArchived: false,
  updatedAt: "2026-10-17T12:00:00Z",
};

const complete = vi.fn<() => void>();

function renderConfirmation() {
  return renderHook(() => useCompletionConfirmation(states)).result;
}

beforeEach(() => {
  complete.mockClear();
});

describe("useCompletionConfirmation", () => {
  it("segue sem perguntar quando o estado pedido não fecha task", () => {
    const result = renderConfirmation();

    act(() => result.current.request({ ...card, state: done }, "state-2", complete));

    expect(complete).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toBeNull();
  });

  it("segue sem perguntar quando o card concluído não tem task aberta", () => {
    const result = renderConfirmation();

    act(() => result.current.request({ ...card, doneTaskCount: 5 }, "state-3", complete));

    expect(complete).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toBeNull();
  });

  it("pergunta antes de concluir o card com task aberta, dizendo quantas serão concluídas", () => {
    const result = renderConfirmation();

    act(() => result.current.request(card, "state-3", complete));

    expect(complete).not.toHaveBeenCalled();
    expect(result.current.pending).toMatchObject({ card, openTaskCount: 2 });
  });

  it("conclui quando a pessoa confirma, e para de perguntar", () => {
    const result = renderConfirmation();
    act(() => result.current.request(card, "state-3", complete));

    act(() => result.current.confirm());

    expect(complete).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toBeNull();
  });

  it("não conclui quando a pessoa volta atrás", () => {
    const result = renderConfirmation();
    act(() => result.current.request(card, "state-3", complete));

    act(() => result.current.cancel());

    expect(complete).not.toHaveBeenCalled();
    expect(result.current.pending).toBeNull();
  });
});
