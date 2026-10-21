import { describe, expect, it } from "vitest";
import { readId } from "./search-id";

const BOARD_ID = "0b6f2a1e-3c4d-4e5f-8a9b-1c2d3e4f5a6b";

describe("readId", () => {
  it("mantém o identificador válido, em minúsculas ou maiúsculas", () => {
    expect(readId(BOARD_ID)).toBe(BOARD_ID);
    expect(readId(BOARD_ID.toUpperCase())).toBe(BOARD_ID.toUpperCase());
  });

  it.each([undefined, null, 7, true, "", "board-1", `${BOARD_ID}/`, "' OR 1=1"])(
    "descarta %j, que não é identificador",
    value => {
      expect(readId(value)).toBeUndefined();
    }
  );
});
