import { describe, expect, it } from "vitest";
import { emailRequestSchema } from "./email-request.schema";

describe("emailRequestSchema", () => {
  it("normaliza o e-mail informado", () => {
    expect(emailRequestSchema.parse({ email: " Ana@Exemplo.Test " })).toEqual({
      email: "ana@exemplo.test",
    });
  });

  it("recusa o que não é e-mail", () => {
    const result = emailRequestSchema.safeParse({ email: "ana@" });

    expect(result.error?.issues[0].message).toBe("Informe um e-mail válido.");
  });
});
