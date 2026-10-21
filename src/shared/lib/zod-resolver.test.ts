import type { ResolverOptions } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zodResolver } from "./zod-resolver";

const projectSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do projeto.").max(5, "Nome longo demais."),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2,5}$/, "Chave inválida."),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const options: ResolverOptions<ProjectFormValues> = {
  fields: {},
  shouldUseNativeValidation: false,
};

describe("zodResolver", () => {
  it("devolve os valores já transformados pelo schema quando o formulário é válido", async () => {
    const resolve = zodResolver(projectSchema);

    const result = await resolve({ name: "  Mom  ", key: " mom " }, undefined, options);

    expect(result).toEqual({ values: { name: "Mom", key: "MOM" }, errors: {} });
  });

  it("devolve a mensagem do schema no campo que falhou", async () => {
    const resolve = zodResolver(projectSchema);

    const result = await resolve({ name: "", key: "M1" }, undefined, options);

    expect(result.values).toEqual({});
    expect(result.errors.name?.message).toBe("Informe o nome do projeto.");
    expect(result.errors.key?.message).toBe("Chave inválida.");
  });

  it("fica com o primeiro erro de cada campo", async () => {
    const strictSchema = z.object({
      name: z.string().min(3, "Curto demais.").regex(/^\d+$/, "Só números."),
    });

    const result = await zodResolver(strictSchema)({ name: "a" }, undefined, {
      fields: {},
      shouldUseNativeValidation: false,
    });

    expect(result.errors.name?.message).toBe("Curto demais.");
  });

  it("aninha o erro de campo dentro de objeto", async () => {
    const nestedSchema = z.object({ owner: z.object({ email: z.email("E-mail inválido.") }) });

    const result = await zodResolver(nestedSchema)({ owner: { email: "sem-arroba" } }, undefined, {
      fields: {},
      shouldUseNativeValidation: false,
    });

    expect(result.errors.owner?.email?.message).toBe("E-mail inválido.");
  });

  it("põe em root o erro que não pertence a campo nenhum", async () => {
    const matchingSchema = z
      .object({ first: z.string(), second: z.string() })
      .refine(values => values.first === values.second, "Os valores não conferem.");

    const result = await zodResolver(matchingSchema)({ first: "a", second: "b" }, undefined, {
      fields: {},
      shouldUseNativeValidation: false,
    });

    expect(result.errors.root?.message).toBe("Os valores não conferem.");
  });
});
