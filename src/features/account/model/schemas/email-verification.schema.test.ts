import { describe, expect, it } from "vitest";
import { emailVerificationSchema } from "./email-verification.schema";

describe("emailVerificationSchema", () => {
  it("aceita o nome e a senha nova dentro das regras da conta", () => {
    const values = emailVerificationSchema.parse({
      name: " Ana Souza ",
      password: "senha-sintetica-1",
    });

    expect(values).toEqual({ name: "Ana Souza", password: "senha-sintetica-1" });
  });

  it("exige o nome sem os caracteres recusados pelo Core e a senha de 10 a 128 caracteres", () => {
    const result = emailVerificationSchema.safeParse({ name: "Ana <Souza>", password: "curta" });

    expect(result.error?.issues.map(issue => issue.message)).toEqual([
      'O nome não pode ter quebra de linha nem os caracteres < > " / \\ : @.',
      "A senha precisa ter de 10 a 128 caracteres.",
    ]);
  });
});
