import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListProjectMembers, type ProjectMember } from "@/features/project";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import {
  addBoardMember,
  listBoardMembers,
  removeBoardMember,
  setBoardVisibility,
} from "../../api/board.service";
import type { Board } from "../types/board.types";
import { useBoardAccess } from "./use-board-access";

vi.mock("../../api/board.service");
vi.mock("@/features/project", () => ({ useListProjectMembers: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

type TeamResult = ReturnType<typeof useListProjectMembers>;

const board: Board = {
  id: "board-1",
  projectId: "projeto-1",
  name: "Liderança",
  filter: { cardTypes: [], priorities: [], assigneeIds: [], featureIds: [], epicIds: [] },
  visibility: "members",
};

const team: ProjectMember[] = [
  { userId: "ana", name: "Ana Sintética", email: "ana@exemplo.test", role: "administrator" },
  { userId: "bruno", name: "Bruno Sintético", email: "bruno@exemplo.test", role: "member" },
  { userId: "carla", name: "Carla Sintética", email: "carla@exemplo.test", role: "member" },
];

function renderAccess() {
  return renderHook(() => useBoardAccess(board), { wrapper: createQueryWrapper().wrapper });
}

beforeEach(() => {
  vi.mocked(listBoardMembers).mockReset();
  vi.mocked(setBoardVisibility).mockReset();
  vi.mocked(addBoardMember).mockReset();
  vi.mocked(removeBoardMember).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(useListProjectMembers).mockReturnValue({ data: team } as unknown as TeamResult);
  vi.mocked(listBoardMembers).mockResolvedValue([
    { userId: "bruno", name: "Bruno Sintético", addedAt: "2026-10-22T12:00:00Z" },
  ]);
});

describe("useBoardAccess", () => {
  it("separa os administradores, que sempre veem, de quem ainda pode receber acesso", async () => {
    const { result } = renderAccess();

    await waitFor(() => expect(result.current.members.isSuccess).toBe(true));

    expect(result.current.administrators.map(member => member.userId)).toEqual(["ana"]);
    expect(result.current.candidates.map(member => member.userId)).toEqual(["carla"]);
  });

  it("muda quem vê, dá e tira o acesso pelo board aberto", async () => {
    vi.mocked(setBoardVisibility).mockResolvedValue({ ...board, visibility: "team" });
    vi.mocked(addBoardMember).mockResolvedValue();
    vi.mocked(removeBoardMember).mockResolvedValue();
    const { result } = renderAccess();

    await act(() => result.current.changeVisibility("team"));
    await act(() => result.current.grantAccess("carla"));
    await act(() => result.current.revokeAccess("bruno"));

    expect(setBoardVisibility).toHaveBeenCalledWith("board-1", "team");
    expect(vi.mocked(addBoardMember).mock.calls[0][0]).toEqual({
      boardId: "board-1",
      userId: "carla",
    });
    expect(vi.mocked(removeBoardMember).mock.calls[0][0]).toEqual({
      boardId: "board-1",
      userId: "bruno",
    });
  });

  it("mostra a recusa do Core sem lançar", async () => {
    vi.mocked(addBoardMember).mockRejectedValue(
      apiError(
        422,
        "BoardMemberOutsideProject",
        "Só quem está no time do projeto pode ter acesso ao board."
      )
    );
    const { result } = renderAccess();

    await act(() => result.current.grantAccess("carla"));

    expect(toast.error).toHaveBeenCalledWith(
      "Só quem está no time do projeto pode ter acesso ao board."
    );
  });
});
