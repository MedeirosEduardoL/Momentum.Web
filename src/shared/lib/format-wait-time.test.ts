import { describe, expect, it } from "vitest";
import { formatWaitTime } from "./format-wait-time";

describe("formatWaitTime", () => {
  it.each([
    [0, "1 segundo"],
    [1, "1 segundo"],
    [30, "30 segundos"],
    [59.2, "1 minuto"],
    [60, "1 minuto"],
    [61, "2 minutos"],
    [900, "15 minutos"],
    [3540, "59 minutos"],
    [3541, "1 hora"],
    [7200, "2 horas"],
    [82800, "23 horas"],
    [86400, "1 dia"],
    [1555200, "18 dias"],
  ])("%s segundos → %s", (seconds, expected) => {
    expect(formatWaitTime(seconds)).toBe(expected);
  });
});
