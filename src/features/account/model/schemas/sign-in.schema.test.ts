import { describe, expect, it } from "vitest";
import { signInSchema } from "./sign-in.schema";

describe("signInSchema", () => {
  it("normaliza o e-mail e mantém a senha como foi digitada", () => {
    const values = signInSchema.parse({ email: " Ana@Exemplo.Test ", password: " curta " });

    expect(values).toEqual({ email: "ana@exemplo.test", password: " curta " });
  });

  it("exige e-mail válido e senha, sem impor o tamanho da senha nova", () => {
    const result = signInSchema.safeParse({ email: "ana", password: "" });

    expect(result.error?.issues.map(issue => issue.message)).toEqual([
      "Informe um e-mail válido.",
      "Informe a sua senha.",
    ]);
  });
});
