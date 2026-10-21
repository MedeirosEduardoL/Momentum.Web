import { describe, expect, it } from "vitest";
import type { CardSubitemCounts } from "../types/card.types";
import { describeSubitemCount, isOpenImpediment, listPresentKinds } from "./card-subitems";

const counts: CardSubitemCounts = {
  task: { total: 3, done: 1 },
  bug: { total: 0, done: 0 },
  impediment: { total: 1, done: 1 },
};

describe("card-subitems", () => {
  it("lista só os tipos que o card tem, na ordem task, bug e impedimento", () => {
    expect(listPresentKinds(counts)).toEqual(["task", "impediment"]);
  });

  it("escreve os concluídos sobre o total", () => {
    expect(describeSubitemCount(counts.task)).toBe("1/3");
  });

  it("só trata como impedimento aberto o impedimento que ainda não foi concluído", () => {
    expect(isOpenImpediment("impediment", counts.impediment)).toBe(false);
    expect(isOpenImpediment("impediment", { total: 2, done: 1 })).toBe(true);
    expect(isOpenImpediment("bug", { total: 2, done: 1 })).toBe(false);
  });
});
