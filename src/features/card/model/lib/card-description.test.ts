import { describe, expect, it } from "vitest";
import type { Card } from "../types/card.types";
import {
  describeCardDates,
  describeCardProgress,
  describeRelatedCard,
  describeTaskProgress,
} from "./card-description";

describe("describeRelatedCard", () => {
  it("escreve o tipo e o estado do outro card da relação", () => {
    expect(
      describeRelatedCard({
        id: "card-2",
        identifier: "SUP-7",
        type: "issue",
        title: "Lista de chamados vazia",
        stateName: "Em revisão",
      })
    ).toBe("Issue · Em revisão");
  });
});

const LOCAL_NOON = 12;

function localNoon(year: number, month: number, day: number) {
  return new Date(year, month - 1, day, LOCAL_NOON).toISOString();
}

const card: Card = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "tech_debt",
  title: "Pagar a dívida do build",
  state: { id: "state-2", name: "Em andamento", category: "in_progress", position: 2 },
  priority: "high",
  assignee: { userId: "user-1", name: "Ana Souza" },
  featureId: null,
  progress: 40,
  taskCount: 5,
  doneTaskCount: 2,
  subitemCounts: {
    task: { total: 0, done: 0 },
    bug: { total: 0, done: 0 },
    impediment: { total: 0, done: 0 },
  },
  isArchived: false,
  updatedAt: localNoon(2026, 10, 13),
  description: "",
  fields: { type: "tech_debt", impact: "" },
  createdAt: localNoon(2026, 10, 12),
};

describe("describeTaskProgress", () => {
  it("escreve quantos subitens do card estão concluídos", () => {
    expect(describeTaskProgress(card)).toBe("2 de 5 subitens concluídos");
  });

  it("escreve no singular quando o card tem um subitem só", () => {
    expect(describeTaskProgress({ taskCount: 1, doneTaskCount: 0 })).toBe(
      "0 de 1 subitem concluído"
    );
  });
});

describe("describeCardProgress", () => {
  it("escreve o progresso e os subitens concluídos", () => {
    expect(describeCardProgress(card)).toBe("Progresso de 40% · 2 de 5 subitens concluídos");
  });

  it("não fala de tasks no card que não tem nenhuma", () => {
    expect(describeCardProgress({ ...card, progress: 0, taskCount: 0, doneTaskCount: 0 })).toBe(
      "Progresso de 0%"
    );
  });
});

describe("describeCardDates", () => {
  it("escreve quando o card foi criado e alterado, no fuso de quem lê", () => {
    expect(describeCardDates(card)).toBe("Criado em 12/10/2026 · Alterado em 13/10/2026");
  });
});
