import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { projectKeys } from "../../api/project-api-keys";
import { createProject } from "../../api/project.service";
import type { ProjectFormValues } from "../schemas/project.schema";
import type { Project } from "../types/project.types";
import { useCreateProject } from "./use-create-project";

vi.mock("../../api/project.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const validValues: ProjectFormValues = { name: " Momentum ", key: "mom" };
const createdProject: Project = {
  id: "project-1",
  name: "Momentum",
  key: "MOM",
  role: "administrator",
};
const onCreated = vi.fn<(project: Project) => void>();

function renderCreateProject() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useCreateProject({ onCreated }), { wrapper });

  return { result, invalidateQueries };
}

async function submit(
  result: ReturnType<typeof renderCreateProject>["result"],
  values: ProjectFormValues
) {
  await act(async () => {
    result.current.form.reset(values);
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  vi.mocked(createProject).mockReset().mockResolvedValue(createdProject);
  vi.mocked(toast.error).mockClear();
  onCreated.mockClear();
});

describe("useCreateProject", () => {
  it("cria o projeto com o nome sem espaços e a chave em maiúsculas, recarrega os projetos e entrega o projeto criado", async () => {
    const { result, invalidateQueries } = renderCreateProject();

    await submit(result, validValues);

    expect(vi.mocked(createProject).mock.calls[0][0]).toEqual({ name: "Momentum", key: "MOM" });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: projectKeys.all });
    expect(onCreated).toHaveBeenCalledWith(createdProject);
  });

  it("não chama a API quando o schema recusa os campos", async () => {
    const { result } = renderCreateProject();

    await submit(result, { name: "", key: "M1" });

    expect(createProject).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("name").error?.message).toBe(
      "Informe o nome do projeto."
    );
    expect(result.current.form.getFieldState("key").error?.message).toBe(
      "A chave do projeto tem de 2 a 5 letras, sem acento."
    );
  });

  it("põe no campo da chave o conflito vindo do Core", async () => {
    vi.mocked(createProject).mockRejectedValue(
      apiError(
        409,
        "ProjectKeyAlreadyUsed",
        "Já existe um projeto com esta chave na organização.",
        {
          property: "key",
        }
      )
    );
    const { result, invalidateQueries } = renderCreateProject();

    await submit(result, validValues);

    expect(result.current.form.getFieldState("key").error?.message).toBe(
      "Já existe um projeto com esta chave na organização."
    );
    expect(onCreated).not.toHaveBeenCalled();
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it.each([
    ["ProjectNameRequired", "Informe o nome do projeto.", "name"],
    ["ProjectNameTooLong", "O nome do projeto pode ter no máximo 120 caracteres.", "name"],
    ["ProjectKeyInvalid", "A chave do projeto tem de 2 a 5 letras, sem acento.", "key"],
  ] as const)("põe no campo o erro %s vindo do Core", async (code, details, field) => {
    vi.mocked(createProject).mockRejectedValue(apiError(400, code, details, { property: field }));
    const { result } = renderCreateProject();

    await submit(result, validValues);

    expect(result.current.form.getFieldState(field).error?.message).toBe(details);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("avisa quem não é administrador da organização que o Core recusou a criação", async () => {
    vi.mocked(createProject).mockRejectedValue(
      apiError(403, "AccessDenied", "Você não tem acesso a este recurso.")
    );
    const { result } = renderCreateProject();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith("Você não tem acesso a este recurso.");
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("mostra a falha de rede sem fechar o formulário", async () => {
    vi.mocked(createProject).mockRejectedValue(networkFailure);
    const { result } = renderCreateProject();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(onCreated).not.toHaveBeenCalled();
  });
});
