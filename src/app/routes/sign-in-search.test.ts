import { describe, expect, it } from "vitest";
import { toSignInSearch } from "./sign-in-search";

describe("toSignInSearch", () => {
  it.each(["email-confirmado", "senha-redefinida", "convite-aceito", "sessao-expirada"])(
    "mantém o aviso conhecido %j",
    aviso => {
      expect(toSignInSearch({ aviso })).toEqual({ aviso });
    }
  );

  it.each([undefined, null, 1, "", "outro-aviso", "toString", "constructor"])(
    "descarta o valor %j",
    aviso => {
      expect(toSignInSearch({ aviso })).toEqual({});
    }
  );

  it("ignora outros parâmetros da URL", () => {
    expect(toSignInSearch({ aviso: "convite-aceito", origem: "email" })).toEqual({
      aviso: "convite-aceito",
    });
  });
});
