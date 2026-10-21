import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListOrganizationMembers, type OrganizationMember } from "@/features/organization";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { setProjectMember } from "../../api/project.service";
import type { ProjectMemberFormValues } from "../schemas/project-member.schema";
import { useAddProjectMember } from "./use-add-project-member";

vi.mock("../../api/project.service");
vi.mock("@/features/organization", () => ({ useListOrganizationMembers: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

type OrganizationMembersResult = ReturnType<typeof useListOrganizationMembers>;

const PROJECT_ID = "project-1";
const validValues: ProjectMemberFormValues = { userId: "user-2", role: "administrator" };
const onAdded = vi.fn();
const refetchOrganizationMembers = vi.fn<OrganizationMembersResult["refetch"]>();
const refetch: OrganizationMembersResult["refetch"] = refetchOrganizationMembers;
const data: OrganizationMember[] = [];

function renderAddMember() {
  const { result } = renderHook(() => useAddProjectMember({ projectId: PROJECT_ID, onAdded }), {
    wrapper: createQueryWrapper().wrapper,
  });

  return result;
}

async function submit(result: ReturnType<typeof renderAddMember>, values: ProjectMemberFormValues) {
  await act(async () => {
    result.current.form.reset(values);
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  vi.mocked(setProjectMember).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
  onAdded.mockClear();
  refetchOrganizationMembers.mockReset();
  vi.mocked(useListOrganizationMembers).mockReturnValue({
    data,
    refetch,
  } as OrganizationMembersResult);
});

describe("useAddProjectMember", () => {
  it("inclui a pessoa escolhida no time com o papel escolhido", async () => {
    const result = renderAddMember();

    await submit(result, validValues);

    expect(vi.mocked(setProjectMember).mock.calls[0][0]).toEqual({
      projectId: PROJECT_ID,
      userId: "user-2",
      role: "administrator",
    });
    expect(onAdded).toHaveBeenCalledTimes(1);
  });

  it("começa com o papel de membro e sem ninguém escolhido", () => {
    const result = renderAddMember();

    expect(result.current.form.getValues()).toEqual({ userId: "", role: "member" });
  });

  it("não chama a API sem uma pessoa escolhida", async () => {
    const result = renderAddMember();

    await submit(result, { userId: "", role: "member" });

    expect(setProjectMember).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("userId").error?.message).toBe(
      "Escolha quem entra no time."
    );
  });

  it("avisa, desfaz a escolha e recarrega os membros quando a pessoa saiu da organização", async () => {
    vi.mocked(setProjectMember).mockRejectedValue(
      apiError(422, "ProjectMemberOutsideOrganization", "Esta pessoa não participa da organização.")
    );
    const result = renderAddMember();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith("Esta pessoa não participa da organização.");
    expect(refetchOrganizationMembers).toHaveBeenCalledTimes(1);
    expect(result.current.form.getValues("userId")).toBe("");
    expect(onAdded).not.toHaveBeenCalled();
  });

  it("avisa quem não administra o projeto, sem recarregar os membros da organização", async () => {
    vi.mocked(setProjectMember).mockRejectedValue(
      apiError(403, "ProjectAdministrationDenied", "Só o administrador do projeto pode fazer isso.")
    );
    const result = renderAddMember();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith("Só o administrador do projeto pode fazer isso.");
    expect(refetchOrganizationMembers).not.toHaveBeenCalled();
    expect(result.current.form.getValues("userId")).toBe("user-2");
  });

  it("mostra a falha de rede e mantém a escolha", async () => {
    vi.mocked(setProjectMember).mockRejectedValue(networkFailure);
    const result = renderAddMember();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(onAdded).not.toHaveBeenCalled();
  });
});
