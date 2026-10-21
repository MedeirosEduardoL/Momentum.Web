import { describe, expect, it } from "vitest";
import type { CardState, CardSummary } from "../types/card.types";
import { countTasksClosedBy, describeTasksClosedBy } from "./card-completion";

const fresh: CardState = { id: "state-1", name: "Novo", category: "to_do", position: 1 };
const doing: CardState = {
  id: "state-2",
  name: "Em andamento",
  category: "in_progress",
  position: 2,
};
const done: CardState = { id: "state-3", name: "Concluído", category: "done", position: 3 };
const delivered: CardState = { id: "state-4", name: "Entregue", category: "done", position: 4 };
const cancelled: CardState = {
  id: "state-5",
  name: "Cancelado",
  category: "cancelled",
  position: 5,
};

function card(state: CardState, taskCount: number, doneTaskCount: number): CardSummary {
  return {
    id: "card-1",
    projectId: "project-1",
    identifier: "MOM-12",
    type: "user_story",
    title: "Filtro por responsável",
    state,
    priority: "medium",
    assignee: null,
    featureId: null,
    progress: 0,
    taskCount,
    doneTaskCount,
    subitemCounts: {
      task: { total: taskCount, done: doneTaskCount },
      bug: { total: 0, done: 0 },
      impediment: { total: 0, done: 0 },
    },
    isArchived: false,
    updatedAt: "2026-10-17T12:00:00Z",
  };
}

describe("countTasksClosedBy", () => {
  it("conta as tasks abertas que o estado concluído vai fechar", () => {
    expect(countTasksClosedBy(card(doing, 5, 3), done)).toBe(2);
  });

  it("conta também ao ir de um estado concluído para outro", () => {
    expect(countTasksClosedBy(card(done, 2, 1), delivered)).toBe(1);
  });

  it("não conta quando todas as tasks já estão concluídas ou o card não tem task", () => {
    expect(countTasksClosedBy(card(doing, 3, 3), done)).toBe(0);
    expect(countTasksClosedBy(card(doing, 0, 0), done)).toBe(0);
  });

  it.each([
    ["a fazer", fresh],
    ["em andamento", doing],
    ["cancelado", cancelled],
  ])("não conta quando o estado pedido é %s", (_case, state) => {
    expect(countTasksClosedBy(card(doing, 4, 1), state)).toBe(0);
  });

  it("não conta quando o card fica no estado em que já está", () => {
    expect(countTasksClosedBy(card(done, 4, 1), done)).toBe(0);
  });

  it("não conta quando o estado pedido não está entre os conhecidos", () => {
    expect(countTasksClosedBy(card(doing, 4, 1), undefined)).toBe(0);
  });
});

describe("describeTasksClosedBy", () => {
  it("diz quantas tasks abertas serão concluídas", () => {
    expect(describeTasksClosedBy(2)).toBe("O card tem 2 subitens abertos, que serão concluídos.");
  });

  it("fala no singular de uma task só", () => {
    expect(describeTasksClosedBy(1)).toBe("O card tem 1 subitem aberto, que será concluído.");
  });
});
