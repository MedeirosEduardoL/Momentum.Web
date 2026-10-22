import { describe, expect, it } from "vitest";
import type { Board } from "../types/board.types";
import { NO_FILTER } from "./board-filter";
import { isMissingBoard, selectBoard } from "./board-selection";

const allCards: Board = {
  id: "board-1",
  projectId: "project-1",
  visibility: "team",
  name: "Todos os cards",
  filter: NO_FILTER,
};
const issues: Board = { ...allCards, id: "board-2", name: "Issues" };

describe("selectBoard", () => {
  it("escolhe o board pedido na URL", () => {
    expect(selectBoard([allCards, issues], "board-2")).toBe(issues);
  });

  it("escolhe o primeiro board do projeto quando a URL não pede nenhum", () => {
    expect(selectBoard([allCards, issues])).toBe(allCards);
  });

  it("escolhe o primeiro board quando o pedido não existe mais ou é de outro projeto", () => {
    expect(selectBoard([allCards, issues], "board-9")).toBe(allCards);
  });

  it("não escolhe nenhum no projeto que ainda não tem board", () => {
    expect(selectBoard([], "board-1")).toBeNull();
    expect(selectBoard([])).toBeNull();
  });
});

describe("isMissingBoard", () => {
  it("diz que falta o board pedido na URL que não está mais no projeto", () => {
    expect(isMissingBoard([allCards, issues], "board-9")).toBe(true);
    expect(isMissingBoard([], "board-1")).toBe(true);
  });

  it("não diz que falta quando o board pedido existe ou a URL não pede nenhum", () => {
    expect(isMissingBoard([allCards, issues], "board-2")).toBe(false);
    expect(isMissingBoard([allCards, issues])).toBe(false);
  });
});
