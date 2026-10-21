import { describe, expect, it } from "vitest";
import { readLinkToken } from "./link-token";

describe("readLinkToken", () => {
  it("lê o token do fragmento, com ou sem a cerquilha", () => {
    expect(readLinkToken("token=abc-DEF_123")).toBe("abc-DEF_123");
    expect(readLinkToken("#token=abc-DEF_123")).toBe("abc-DEF_123");
  });

  it("ignora outros parâmetros do fragmento", () => {
    expect(readLinkToken("origem=email&token=abc")).toBe("abc");
  });

  it.each(["", "#", "token=", "outra-coisa", "tokens=abc"])(
    "devolve null para o fragmento %j",
    fragment => {
      expect(readLinkToken(fragment)).toBeNull();
    }
  );
});
