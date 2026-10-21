import { describe, expect, it } from "vitest";
import { emailSchema, newPasswordSchema, personNameSchema } from "./field-schemas";

function messageOf(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0].message;
}

describe("personNameSchema", () => {
  it("aceita o nome com acento e tira os espaços das pontas", () => {
    expect(personNameSchema.parse("  João D'Ávila  ")).toBe("João D'Ávila");
  });

  it("exige o nome", () => {
    expect(messageOf(personNameSchema.safeParse("   "))).toBe("Informe o seu nome.");
  });

  it("limita o nome a 120 caracteres", () => {
    expect(personNameSchema.safeParse("a".repeat(120)).success).toBe(true);
    expect(messageOf(personNameSchema.safeParse("a".repeat(121)))).toBe(
      "O nome pode ter no máximo 120 caracteres."
    );
  });

  it.each([
    "Ana\nSilva",
    "Ana\tSilva",
    "<Ana>",
    'Ana "Silva"',
    "Ana/Silva",
    "Ana\\Silva",
    "Ana:",
    "ana@exemplo.test",
  ])("recusa o nome %j", name => {
    expect(messageOf(personNameSchema.safeParse(name))).toBe(
      'O nome não pode ter quebra de linha nem os caracteres < > " / \\ : @.'
    );
  });
});

describe("emailSchema", () => {
  it("tira os espaços e passa para minúsculas", () => {
    expect(emailSchema.parse("  Ana.Silva@Exemplo.Test ")).toBe("ana.silva@exemplo.test");
  });

  it.each(["", "ana", "ana@", "ana@exemplo", "@exemplo.test"])("recusa o e-mail %j", email => {
    expect(messageOf(emailSchema.safeParse(email))).toBe("Informe um e-mail válido.");
  });

  it("recusa o e-mail com mais de 254 caracteres", () => {
    const longEmail = `${"a".repeat(243)}@exemplo.test`;

    expect(messageOf(emailSchema.safeParse(longEmail))).toBe("Informe um e-mail válido.");
  });
});

describe("newPasswordSchema", () => {
  it("aceita de 10 a 128 caracteres, sem regra de composição", () => {
    expect(newPasswordSchema.safeParse("aaaaaaaaaa").success).toBe(true);
    expect(newPasswordSchema.safeParse("a".repeat(128)).success).toBe(true);
  });

  it("não mexe nos espaços da senha", () => {
    expect(newPasswordSchema.parse("  senha com espaço  ")).toBe("  senha com espaço  ");
  });

  it.each(["", "a".repeat(9), "a".repeat(129)])("recusa a senha fora do tamanho", password => {
    expect(messageOf(newPasswordSchema.safeParse(password))).toBe(
      "A senha precisa ter de 10 a 128 caracteres."
    );
  });
});
