import { describe, expect, it } from "vitest";
import { signUpSchema } from "./sign-up.schema";

describe("signUpSchema", () => {
  it("aceita nome e e-mail dentro das regras do Core, sem senha", () => {
    const values = signUpSchema.parse({ name: " Ana Souza ", email: "Ana@Exemplo.Test" });

    expect(values).toEqual({ name: "Ana Souza", email: "ana@exemplo.test" });
  });

  it("aponta o campo de cada regra quebrada", () => {
    const result = signUpSchema.safeParse({ name: "Ana:", email: "ana" });

    expect(result.error?.issues.map(issue => [issue.path[0], issue.message])).toEqual([
      ["name", 'O nome não pode ter quebra de linha nem os caracteres < > " / \\ : @.'],
      ["email", "Informe um e-mail válido."],
    ]);
  });
});
