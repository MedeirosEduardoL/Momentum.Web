import { describe, expect, it } from "vitest";
import { formatDate, formatDay } from "./format-date";

const LOCAL_NOON = 12;

function localNoon(year: number, month: number, day: number) {
  return new Date(year, month - 1, day, LOCAL_NOON).toISOString();
}

describe("formatDate", () => {
  it("escreve a data no formato brasileiro, no fuso de quem lê", () => {
    expect(formatDate(localNoon(2026, 10, 19))).toBe("19/10/2026");
  });

  it("mantém o zero à esquerda do dia e do mês", () => {
    expect(formatDate(localNoon(2027, 1, 5))).toBe("05/01/2027");
  });
});

describe("formatDay", () => {
  it("escreve o dia sem hora no formato brasileiro, sem deslocar pelo fuso de quem lê", () => {
    expect(formatDay("2026-10-19")).toBe("19/10/2026");
  });

  it("mantém o primeiro dia do mês no próprio mês", () => {
    expect(formatDay("2027-01-01")).toBe("01/01/2027");
  });
});
