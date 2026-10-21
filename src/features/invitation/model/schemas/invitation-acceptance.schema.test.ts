import { describe, expect, it } from "vitest";
import {
  existingAccountAcceptanceSchema,
  newAccountAcceptanceSchema,
} from "./invitation-acceptance.schema";

describe("newAccountAcceptanceSchema", () => {
  it("aceita nome e senha nova dentro das regras da conta", () => {
    const values = newAccountAcceptanceSchema.parse({
      name: " Bia Lima ",
      password: "senha-sintetica-1",
    });

    expect(values).toEqual({ name: "Bia Lima", password: "senha-sintetica-1" });
  });

  it("exige o nome e a senha de 10 a 128 caracteres", () => {
    const result = newAccountAcceptanceSchema.safeParse({ name: "", password: "curta" });

    expect(result.error?.issues.map(issue => issue.message)).toEqual([
      "Informe o seu nome.",
      "A senha precisa ter de 10 a 128 caracteres.",
    ]);
  });
});

describe("existingAccountAcceptanceSchema", () => {
  it("pede só a senha de quem já tem conta", () => {
    expect(existingAccountAcceptanceSchema.safeParse({ name: "", password: "curta" }).success).toBe(
      true
    );
  });

  it("exige a senha", () => {
    const result = existingAccountAcceptanceSchema.safeParse({ name: "", password: "" });

    expect(result.error?.issues[0].message).toBe("Informe a senha da sua conta.");
  });
});
