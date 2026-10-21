import { describe, expect, it } from "vitest";
import { firstAccessSchema } from "./first-access.schema";

describe("firstAccessSchema", () => {
  it("tira os espaços do nome da organização", () => {
    expect(firstAccessSchema.parse({ organizationName: " Lua Nova " })).toEqual({
      organizationName: "Lua Nova",
    });
  });

  it("exige o nome da organização", () => {
    const result = firstAccessSchema.safeParse({ organizationName: " " });

    expect(result.error?.issues[0].message).toBe("Informe o nome da organização.");
  });

  it("limita o nome a 120 caracteres", () => {
    const result = firstAccessSchema.safeParse({ organizationName: "a".repeat(121) });

    expect(result.error?.issues[0].message).toBe(
      "O nome da organização pode ter no máximo 120 caracteres."
    );
  });

  it("aceita o nome com 120 caracteres", () => {
    expect(firstAccessSchema.safeParse({ organizationName: "a".repeat(120) }).success).toBe(true);
  });
});
