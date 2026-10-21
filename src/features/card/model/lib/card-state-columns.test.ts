import { describe, expect, it } from "vitest";
import type {
  CardAssignee,
  CardLaneGrouping,
  CardState,
  CardStateColumn,
  CardSummary,
} from "../types/card.types";
import {
  changesAssignee,
  changesPlace,
  containsCard,
  describeColumnCount,
  describeLaneCount,
  isTruncated,
  moveCard,
  toCardLanes,
} from "./card-state-columns";

const fresh: CardState = { id: "state-1", name: "Novo", category: "to_do", position: 1 };
const doing: CardState = {
  id: "state-2",
  name: "Em andamento",
  category: "in_progress",
  position: 2,
};
const done: CardState = { id: "state-3", name: "Concluído", category: "done", position: 3 };

const ana: CardAssignee = { userId: "user-1", name: "Ana Souza" };
const bruno: CardAssignee = { userId: "user-2", name: "Bruno Lima" };
const erica: CardAssignee = { userId: "user-3", name: "Érica Dias" };
const davi: CardAssignee = { userId: "user-4", name: "Davi Rocha" };

const withoutTeam: CardLaneGrouping = { team: [] };

function card(id: string, state: CardState, assignee: CardAssignee | null = null): CardSummary {
  return {
    id,
    projectId: "project-1",
    identifier: `MOM-${id}`,
    type: "issue",
    title: `Card ${id}`,
    state,
    priority: "medium",
    assignee,
    featureId: null,
    progress: 0,
    taskCount: 0,
    doneTaskCount: 0,
    subitemCounts: {
      task: { total: 0, done: 0 },
      bug: { total: 0, done: 0 },
      impediment: { total: 0, done: 0 },
    },
    isArchived: false,
    updatedAt: "2026-10-13T12:00:00Z",
  };
}

function column(state: CardState, cards: CardSummary[], totalCount = cards.length) {
  return { state, totalCount, cards } satisfies CardStateColumn;
}

function idsOf(columns: CardStateColumn[]) {
  return columns.map(shown => shown.cards.map(shownCard => shownCard.id));
}

const columns = [
  column(fresh, [card("1", fresh, ana), card("2", fresh)]),
  column(doing, [card("3", doing, bruno)]),
  column(done, []),
];

describe("moveCard", () => {
  it("leva o card para o topo da coluna do estado pedido, já com o estado novo", () => {
    const moved = moveCard(columns, { cardId: "2", cardStateId: "state-2" });

    expect(idsOf(moved)).toEqual([["1"], ["2", "3"], []]);
    expect(moved[1].cards[0].state).toEqual(doing);
  });

  it("acerta o total das duas colunas", () => {
    const moved = moveCard(columns, { cardId: "1", cardStateId: "state-3" });

    expect(moved.map(shown => shown.totalCount)).toEqual([1, 1, 1]);
  });

  it("mantém o corte da coluna de origem que mostra só parte dos cards", () => {
    const truncated = [column(fresh, [card("1", fresh)], 250), column(done, [])];

    const moved = moveCard(truncated, { cardId: "1", cardStateId: "state-3" });

    expect(moved.map(shown => shown.totalCount)).toEqual([249, 1]);
  });

  it("não muda nada enquanto não há movimento", () => {
    expect(moveCard(columns, null)).toBe(columns);
  });

  it.each([
    ["o card já está no estado pedido", { cardId: "1", cardStateId: "state-1" }],
    ["o card não está no board", { cardId: "9", cardStateId: "state-2" }],
    ["o estado não é uma coluna", { cardId: "1", cardStateId: "state-9" }],
  ])("não muda nada quando %s", (_case, move) => {
    expect(moveCard(columns, move)).toBe(columns);
  });

  it("não altera as colunas recebidas", () => {
    moveCard(columns, { cardId: "2", cardStateId: "state-2" });

    expect(idsOf(columns)).toEqual([["1", "2"], ["3"], []]);
  });

  it("leva o card para a raia do responsável pedido, com o estado novo", () => {
    const moved = moveCard(columns, { cardId: "2", cardStateId: "state-2", assignee: bruno });

    expect(idsOf(moved)).toEqual([["1"], ["2", "3"], []]);
    expect(moved[1].cards[0].assignee).toEqual(bruno);
  });

  it("muda só o responsável do card que fica na mesma coluna, sem mudar o total", () => {
    const moved = moveCard(columns, { cardId: "1", cardStateId: "state-1", assignee: null });

    expect(idsOf(moved)).toEqual([["1", "2"], ["3"], []]);
    expect(moved[0].cards[0].assignee).toBeNull();
    expect(moved.map(shown => shown.totalCount)).toEqual([2, 1, 0]);
  });

  it("mantém o responsável quando o movimento não diz qual é", () => {
    const moved = moveCard(columns, { cardId: "1", cardStateId: "state-3" });

    expect(moved[2].cards[0].assignee).toEqual(ana);
  });

  it("não muda nada quando o card já está no estado e na raia pedidos", () => {
    expect(moveCard(columns, { cardId: "1", cardStateId: "state-1", assignee: ana })).toBe(columns);
  });
});

describe("changesPlace", () => {
  const assigned = card("1", fresh, ana);

  it("diz que muda quando o estado é outro", () => {
    expect(changesPlace(assigned, { cardStateId: "state-2" })).toBe(true);
  });

  it("diz que muda quando o responsável é outro, ou nenhum, no mesmo estado", () => {
    expect(changesPlace(assigned, { cardStateId: "state-1", assignee: bruno })).toBe(true);
    expect(changesPlace(assigned, { cardStateId: "state-1", assignee: null })).toBe(true);
    expect(changesAssignee(card("2", fresh), { cardStateId: "state-1", assignee: ana })).toBe(true);
  });

  it("diz que não muda no mesmo estado, com o mesmo responsável ou sem dizer qual", () => {
    expect(changesPlace(assigned, { cardStateId: "state-1", assignee: ana })).toBe(false);
    expect(changesPlace(assigned, { cardStateId: "state-1" })).toBe(false);
    expect(changesAssignee(card("2", fresh), { cardStateId: "state-1", assignee: null })).toBe(
      false
    );
  });
});

describe("containsCard", () => {
  it("diz se o card está em alguma das colunas", () => {
    expect(containsCard(columns, "3")).toBe(true);
    expect(containsCard(columns, "9")).toBe(false);
  });
});

describe("contagem da coluna", () => {
  it("escreve o total de cards do estado", () => {
    expect(describeColumnCount(column(fresh, [card("1", fresh), card("2", fresh)]))).toBe(
      "2 cards"
    );
    expect(describeColumnCount(column(doing, [card("3", doing)]))).toBe("1 card");
    expect(describeColumnCount(column(done, []))).toBe("0 cards");
  });

  it("escreve quantos aparecem quando a coluna vem cortada", () => {
    const truncated = column(fresh, [card("1", fresh), card("2", fresh)], 250);

    expect(isTruncated(truncated)).toBe(true);
    expect(describeColumnCount(truncated)).toBe("2 de 250 cards");
  });

  it("não trata como cortada a coluna que mostra todos os cards", () => {
    expect(isTruncated(column(fresh, [card("1", fresh)]))).toBe(false);
  });
});

describe("toCardLanes", () => {
  it("sem agrupar, entrega uma raia só, sem título, com todas as colunas", () => {
    const lanes = toCardLanes(columns, null);

    expect(lanes).toHaveLength(1);
    expect(lanes[0].title).toBeNull();
    expect(lanes[0].assignee).toBeUndefined();
    expect(lanes[0].cells).toBe(columns);
  });

  it("agrupa em uma raia por responsável, com todos os estados em cada uma", () => {
    const lanes = toCardLanes(columns, withoutTeam);

    expect(lanes.map(lane => lane.title)).toEqual(["Ana Souza", "Bruno Lima", "Sem responsável"]);
    expect(lanes.map(lane => lane.assignee)).toEqual([ana, bruno, null]);
    expect(lanes.map(lane => lane.cells.map(cell => cell.state.id))).toEqual([
      ["state-1", "state-2", "state-3"],
      ["state-1", "state-2", "state-3"],
      ["state-1", "state-2", "state-3"],
    ]);
    expect(lanes.map(lane => lane.cells.map(cell => cell.cards.map(shown => shown.id)))).toEqual([
      [["1"], [], []],
      [[], ["3"], []],
      [["2"], [], []],
    ]);
  });

  it("ordena as raias pelo nome, com acento, e deixa os cards sem responsável por último", () => {
    const mixed = [
      column(fresh, [card("1", fresh), card("2", fresh, erica), card("3", fresh, bruno)]),
      column(doing, [card("4", doing, ana), card("5", doing, erica)]),
    ];

    expect(toCardLanes(mixed, withoutTeam).map(lane => lane.title)).toEqual([
      "Ana Souza",
      "Bruno Lima",
      "Érica Dias",
      "Sem responsável",
    ]);
  });

  it("cria a raia de sem responsável, vazia, quando todos os cards têm responsável", () => {
    const assigned = [column(fresh, [card("1", fresh, ana)]), column(doing, [])];

    const lanes = toCardLanes(assigned, withoutTeam);

    expect(lanes.map(lane => lane.title)).toEqual(["Ana Souza", "Sem responsável"]);
    expect(lanes.map(describeLaneCount)).toEqual(["1 card", "0 cards"]);
  });

  it("cria uma raia vazia para cada pessoa do time sem card, em ordem alfabética", () => {
    const lanes = toCardLanes(columns, { team: [erica, davi, ana, bruno] });

    expect(lanes.map(lane => lane.title)).toEqual([
      "Ana Souza",
      "Bruno Lima",
      "Davi Rocha",
      "Érica Dias",
      "Sem responsável",
    ]);
    expect(lanes.map(lane => lane.assignee)).toEqual([ana, bruno, davi, erica, null]);
    expect(lanes.map(describeLaneCount)).toEqual([
      "1 card",
      "1 card",
      "0 cards",
      "0 cards",
      "1 card",
    ]);
    expect(lanes[2].cells.map(cell => cell.state.id)).toEqual(["state-1", "state-2", "state-3"]);
  });

  it("mostra a raia vazia de cada pessoa do time e a de sem responsável num board sem card", () => {
    const lanes = toCardLanes([column(fresh, []), column(doing, [])], { team: [bruno, ana] });

    expect(lanes.map(lane => lane.title)).toEqual(["Ana Souza", "Bruno Lima", "Sem responsável"]);
    expect(lanes.map(describeLaneCount)).toEqual(["0 cards", "0 cards", "0 cards"]);
  });

  it("mantém a raia de quem tem card na tela e não está mais no time", () => {
    const lanes = toCardLanes(columns, { team: [ana] });

    expect(lanes.map(lane => lane.title)).toEqual(["Ana Souza", "Bruno Lima", "Sem responsável"]);
  });

  it("com uma pessoa escolhida, mostra só a raia dela, mesmo vazia", () => {
    const lanes = toCardLanes([column(fresh, []), column(doing, [])], {
      team: [ana, bruno, davi],
      assigneeId: davi.userId,
    });

    expect(lanes.map(lane => lane.title)).toEqual(["Davi Rocha"]);
    expect(lanes[0].assignee).toEqual(davi);
  });

  it("com uma pessoa escolhida, não cria a raia de sem responsável", () => {
    const anaCards = [column(fresh, [card("1", fresh, ana)]), column(doing, [])];

    const lanes = toCardLanes(anaCards, { team: [ana, bruno], assigneeId: ana.userId });

    expect(lanes.map(lane => lane.title)).toEqual(["Ana Souza"]);
  });

  it("com sem responsável escolhido, mostra só essa raia, mesmo vazia", () => {
    const lanes = toCardLanes([column(fresh, []), column(doing, [])], {
      team: [ana, bruno],
      isUnassigned: true,
    });

    expect(lanes.map(lane => lane.title)).toEqual(["Sem responsável"]);
    expect(lanes[0].assignee).toBeNull();
  });

  it("no board que salva responsáveis, mostra só as raias deles, sem a de sem responsável", () => {
    const lanes = toCardLanes([column(fresh, [card("1", fresh, ana)]), column(doing, [])], {
      team: [ana, bruno, erica],
      savedAssigneeIds: [erica.userId, ana.userId],
    });

    expect(lanes.map(lane => lane.title)).toEqual(["Ana Souza", "Érica Dias"]);
  });

  it("deixa a pessoa escolhida na tela valer sobre os responsáveis salvos no board", () => {
    const lanes = toCardLanes([column(fresh, []), column(doing, [])], {
      team: [ana, bruno],
      savedAssigneeIds: [ana.userId],
      assigneeId: bruno.userId,
    });

    expect(lanes.map(lane => lane.title)).toEqual(["Bruno Lima"]);
  });

  it("mantém a raia de sem responsável escolhida na tela, mesmo com responsáveis salvos", () => {
    const lanes = toCardLanes([column(fresh, []), column(doing, [])], {
      team: [ana, bruno],
      savedAssigneeIds: [ana.userId],
      isUnassigned: true,
    });

    expect(lanes.map(lane => lane.title)).toEqual(["Sem responsável"]);
  });

  it("escreve quantos cards a raia tem, somando os estados", () => {
    const lanes = toCardLanes(
      [
        column(fresh, [card("1", fresh, ana), card("3", fresh)]),
        column(doing, [card("2", doing, ana)]),
      ],
      withoutTeam
    );

    expect(lanes.map(describeLaneCount)).toEqual(["2 cards", "1 card"]);
  });
});
