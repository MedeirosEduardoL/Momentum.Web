import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGetCurrentAccount } from "@/features/account";
import type { Card } from "@/features/card";
import { useGetCurrentOrganization } from "@/features/organization";
import { useListProjects, type Project } from "@/features/project";
import { useCardInterviewAccess } from "./use-card-interview-access";

vi.mock("@/features/account", () => ({ useGetCurrentAccount: vi.fn() }));
vi.mock("@/features/organization", () => ({ useGetCurrentOrganization: vi.fn() }));
vi.mock("@/features/project", async importOriginal => ({
  ...(await importOriginal<typeof import("@/features/project")>()),
  useListProjects: vi.fn(),
}));

type AccountResult = ReturnType<typeof useGetCurrentAccount>;
type OrganizationResult = ReturnType<typeof useGetCurrentOrganization>;
type ProjectsResult = ReturnType<typeof useListProjects>;

const card = { id: "card-1", projectId: "project-1" } as Card;
const administered: Project = {
  id: "project-1",
  name: "Momentum",
  key: "MOM",
  role: "administrator",
};

function signedInAs(isAiEnabled: boolean, projects: Project[] | undefined) {
  vi.mocked(useGetCurrentAccount).mockReturnValue({
    data: { id: "user-1", name: "Ana Souza", email: "ana@exemplo.test" },
  } as AccountResult);
  vi.mocked(useGetCurrentOrganization).mockReturnValue({
    data: { id: "org-1", name: "Lua Nova", role: "member", isAiEnabled },
  } as OrganizationResult);
  vi.mocked(useListProjects).mockReturnValue({ data: projects } as ProjectsResult);
}

beforeEach(() => {
  signedInAs(true, [administered]);
});

describe("useCardInterviewAccess", () => {
  it("junta quem é a pessoa, se pode entrevistar e se administra o projeto do card", () => {
    const { result } = renderHook(() => useCardInterviewAccess(card));

    expect(result.current).toEqual({
      userId: "user-1",
      isAiEnabled: true,
      canAdministerProject: true,
    });
  });

  it("lê o papel no projeto do card, e não o de outro projeto", () => {
    signedInAs(false, [
      { ...administered, role: "member" },
      { ...administered, id: "project-2" },
    ]);

    const { result } = renderHook(() => useCardInterviewAccess(card));

    expect(result.current).toMatchObject({
      isAiEnabled: false,
      canAdministerProject: false,
    });
  });

  it("não libera nada enquanto a conta, a organização e os projetos não chegam", () => {
    vi.mocked(useGetCurrentAccount).mockReturnValue({ data: undefined } as AccountResult);
    vi.mocked(useGetCurrentOrganization).mockReturnValue({ data: undefined } as OrganizationResult);
    vi.mocked(useListProjects).mockReturnValue({ data: undefined } as ProjectsResult);

    const { result } = renderHook(() => useCardInterviewAccess(card));

    expect(result.current).toEqual({
      userId: null,
      isAiEnabled: false,
      canAdministerProject: false,
    });
  });
});
