import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { projectKeys } from "../../api/project-api-keys";
import { removeProjectMember, setProjectMember } from "../../api/project.service";
import type { ProjectMember } from "../types/project.types";
import { useProjectMemberActions } from "./use-project-member-actions";

vi.mock("../../api/project.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const PROJECT_ID = "project-1";
const member: ProjectMember = {
  userId: "user-2",
  name: "Bia Lima",
  email: "bia@exemplo.test",
  role: "member",
};
const administrationDenied = apiError(
  403,
  "ProjectAdministrationDenied",
  "Só o administrador do projeto pode fazer isso."
);

function renderActions() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useProjectMemberActions(PROJECT_ID), { wrapper });

  return { result, invalidateQueries };
}

beforeEach(() => {
  vi.mocked(setProjectMember).mockReset().mockResolvedValue(undefined);
  vi.mocked(removeProjectMember).mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
});

describe("useProjectMemberActions — papel", () => {
  it("muda o papel da pessoa no time e recarrega os projetos e os times", async () => {
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.changeRole("user-2", "administrator"));

    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: projectKeys.all })
    );
    expect(vi.mocked(setProjectMember).mock.calls[0][0]).toEqual({
      projectId: PROJECT_ID,
      userId: "user-2",
      role: "administrator",
    });
  });

  it("avisa quem perdeu a administração do projeto e recarrega o papel dele", async () => {
    vi.mocked(setProjectMember).mockRejectedValue(administrationDenied);
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.changeRole("user-2", "administrator"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Só o administrador do projeto pode fazer isso.")
    );
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: projectKeys.all });
  });
});

describe("useProjectMemberActions — tirar do time", () => {
  it("tira a pessoa do time, confirma na tela e recarrega o time", async () => {
    const { result, invalidateQueries } = renderActions();

    await act(() => result.current.remove(member));

    expect(vi.mocked(removeProjectMember).mock.calls[0][0]).toEqual({
      projectId: PROJECT_ID,
      userId: "user-2",
    });
    expect(toast.success).toHaveBeenCalledWith("Bia Lima saiu do time.");
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: projectKeys.all });
  });

  it("avisa e recarrega o time quando a pessoa já não estava nele", async () => {
    vi.mocked(removeProjectMember).mockRejectedValue(
      apiError(404, "ProjectMemberNotFound", "Esta pessoa não faz parte do time do projeto.")
    );
    const { result, invalidateQueries } = renderActions();

    await act(() => result.current.remove(member));

    expect(toast.error).toHaveBeenCalledWith("Esta pessoa não faz parte do time do projeto.");
    expect(toast.success).not.toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: projectKeys.all });
  });

  it("avisa quem não administra o projeto que o Core recusou", async () => {
    vi.mocked(removeProjectMember).mockRejectedValue(administrationDenied);
    const { result } = renderActions();

    await act(() => result.current.remove(member));

    expect(toast.error).toHaveBeenCalledWith("Só o administrador do projeto pode fazer isso.");
  });
});
