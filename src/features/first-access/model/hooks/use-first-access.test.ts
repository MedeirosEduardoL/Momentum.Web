import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGetCurrentOrganization, type Organization } from "@/features/organization";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { createOrganization } from "../../api/first-access.service";
import { useFirstAccess } from "./use-first-access";

vi.mock("../../api/first-access.service");
vi.mock("@/features/organization", () => ({ useGetCurrentOrganization: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

type CurrentOrganizationResult = ReturnType<typeof useGetCurrentOrganization>;

const organization: Organization = {
  id: "org-1",
  name: "Lua Nova",
  role: "administrator",
  isAiEnabled: false,
};
const refetchOrganization = vi.fn<CurrentOrganizationResult["refetch"]>();

function withCurrentOrganization(data: Organization | null) {
  const refetch: CurrentOrganizationResult["refetch"] = refetchOrganization;

  vi.mocked(useGetCurrentOrganization).mockReturnValue({
    data,
    refetch,
  } as CurrentOrganizationResult);
}

function renderFirstAccess() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useFirstAccess(), { wrapper });

  return { result, invalidateQueries };
}

async function submit(
  result: ReturnType<typeof renderFirstAccess>["result"],
  organizationName: string
) {
  await act(async () => {
    result.current.form.reset({ organizationName });
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  vi.mocked(createOrganization).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
  refetchOrganization.mockReset();
  withCurrentOrganization(null);
});

describe("useFirstAccess", () => {
  it("cria a organização e atualiza o cache, para o guard seguir ao passo do projeto", async () => {
    const { result, invalidateQueries } = renderFirstAccess();

    await submit(result, " Lua Nova ");

    expect(vi.mocked(createOrganization).mock.calls[0][0]).toBe("Lua Nova");
    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).toHaveBeenCalledWith();
  });

  it("não chama a API quando o schema recusa o nome", async () => {
    const { result } = renderFirstAccess();

    await submit(result, "");

    expect(createOrganization).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("organizationName").error?.message).toBe(
      "Informe o nome da organização."
    );
  });

  it("mostra o passo do projeto a quem já tem organização", () => {
    withCurrentOrganization(organization);

    const { result } = renderFirstAccess();

    expect(result.current.hasOrganization).toBe(true);
  });

  it("pede a organização a quem ainda não tem", () => {
    const { result } = renderFirstAccess();

    expect(result.current.hasOrganization).toBe(false);
  });

  it("põe no campo o erro de nome vindo do Core e não atualiza o cache", async () => {
    vi.mocked(createOrganization).mockRejectedValue(
      apiError(
        400,
        "OrganizationNameTooLong",
        "O nome da organização pode ter no máximo 120 caracteres.",
        { property: "name" }
      )
    );
    const { result, invalidateQueries } = renderFirstAccess();

    await submit(result, "Lua Nova");

    expect(result.current.form.getFieldState("organizationName").error?.message).toBe(
      "O nome da organização pode ter no máximo 120 caracteres."
    );
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it("busca a organização de novo, sem aviso de erro, quando a conta já participa de uma", async () => {
    vi.mocked(createOrganization).mockRejectedValue(
      apiError(409, "OrganizationAlreadyJoined", "Você já participa de uma organização.")
    );
    const { result } = renderFirstAccess();

    await submit(result, "Lua Nova");

    expect(refetchOrganization).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("organizationName").error).toBeUndefined();
  });

  it("mostra a falha de rede e mantém a tela na organização", async () => {
    vi.mocked(createOrganization).mockRejectedValue(networkFailure);
    const { result } = renderFirstAccess();

    await submit(result, "Lua Nova");

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(refetchOrganization).not.toHaveBeenCalled();
    expect(result.current.hasOrganization).toBe(false);
  });
});
