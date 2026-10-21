import { describe, expect, it } from "vitest";
import { linkPasswordSchema } from "./link-password.schema";

describe("linkPasswordSchema", () => {
  it("aceita a senha nova de 10 a 128 caracteres", () => {
    expect(linkPasswordSchema.safeParse({ password: "senha-sintetica-1" }).success).toBe(true);
  });

  it("recusa a senha nova curta", () => {
    const result = linkPasswordSchema.safeParse({ password: "curta" });

    expect(result.error?.issues[0].message).toBe("A senha precisa ter de 10 a 128 caracteres.");
  });
});
