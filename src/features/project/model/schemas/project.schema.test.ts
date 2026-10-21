import { describe, expect, it } from "vitest";
import { projectSchema } from "./project.schema";

const validValues = { name: " Momentum ", key: " mom " };

describe("projectSchema", () => {
  it("tira os espaços do nome e passa a chave do projeto para maiúsculas", () => {
    expect(projectSchema.parse(validValues)).toEqual({ name: "Momentum", key: "MOM" });
  });

  it("exige o nome do projeto", () => {
    const result = projectSchema.safeParse({ ...validValues, name: " " });

    expect(result.error?.issues[0].message).toBe("Informe o nome do projeto.");
  });

  it("limita o nome a 120 caracteres", () => {
    const result = projectSchema.safeParse({ ...validValues, name: "b".repeat(121) });

    expect(result.error?.issues[0].message).toBe(
      "O nome do projeto pode ter no máximo 120 caracteres."
    );
  });

  it.each(["M", "MOMENT", "MO1", "AÇÃO", "M O", ""])("recusa a chave do projeto %j", key => {
    const result = projectSchema.safeParse({ ...validValues, key });

    expect(result.error?.issues[0].message).toBe(
      "A chave do projeto tem de 2 a 5 letras, sem acento."
    );
  });

  it.each(["mo", "MOMEN"])("aceita a chave do projeto %j", key => {
    expect(projectSchema.safeParse({ ...validValues, key }).success).toBe(true);
  });
});
