import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListProjectMembers, type ProjectMember } from "@/features/project";
import { createQueryWrapper } from "@/test/query-wrapper";
import { updateCard } from "../api/card.service";
import type { Card, CardOptions, CardState } from "../model/types/card.types";
import { CardProperties } from "./card-properties";

vi.mock("../api/card.service");
vi.mock("@/features/project", () => ({ useListProjectMembers: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

type TeamResult = ReturnType<typeof useListProjectMembers>;

const doing: CardState = {
  id: "state-2",
  name: "Em andamento",
  category: "in_progress",
  position: 2,
};
const done: CardState = { id: "state-3", name: "Concluído", category: "done", position: 3 };
const options: CardOptions = { states: [doing, done], team: [] };
const team: ProjectMember[] = [];
const refetch: TeamResult["refetch"] = vi.fn<TeamResult["refetch"]>();

const card: Card = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "user_story",
  title: "Filtro por responsável",
  state: doing,
  priority: "medium",
  assignee: null,
  featureId: null,
  progress: 50,
  taskCount: 4,
  doneTaskCount: 2,
  subitemCounts: {
    task: { total: 0, done: 0 },
    bug: { total: 0, done: 0 },
    impediment: { total: 0, done: 0 },
  },
  isArchived: false,
  updatedAt: "2026-10-17T12:00:00Z",
  description: "",
  fields: { type: "user_story", acceptanceCriteria: [] },
  createdAt: "2026-10-16T09:00:00Z",
};

function renderProperties(shown = card) {
  render(<CardProperties card={shown} options={options} />, {
    wrapper: createQueryWrapper().wrapper,
  });

  return userEvent.setup();
}

beforeEach(() => {
  vi.mocked(updateCard).mockReset().mockResolvedValue(card);
  vi.mocked(useListProjectMembers).mockReturnValue({ data: team, refetch } as TeamResult);
});

describe("CardProperties — concluir o card", () => {
  it("pergunta antes de concluir o card com task aberta, e só conclui na confirmação", async () => {
    const user = renderProperties();

    await user.selectOptions(screen.getByRole("combobox", { name: "Estado" }), "state-3");

    const dialog = within(await screen.findByRole("dialog", { name: "Concluir MOM-12?" }));
    expect(dialog.getByText("O card tem 2 subitens abertos, que serão concluídos.")).toBeVisible();
    expect(updateCard).not.toHaveBeenCalled();

    await user.click(dialog.getByRole("button", { name: "Concluir" }));

    await waitFor(() => expect(updateCard).toHaveBeenCalledTimes(1));
    expect(vi.mocked(updateCard).mock.calls[0][0]).toEqual({
      cardId: "card-1",
      cardStateId: "state-3",
    });
  });

  it("mantém o estado quando a pessoa volta atrás", async () => {
    const user = renderProperties();

    await user.selectOptions(screen.getByRole("combobox", { name: "Estado" }), "state-3");
    await user.click(await screen.findByRole("button", { name: "Voltar" }));

    expect(updateCard).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox", { name: "Estado" })).toHaveValue("state-2");
  });

  it("conclui sem perguntar o card que não tem task aberta", async () => {
    const user = renderProperties({ ...card, doneTaskCount: 4 });

    await user.selectOptions(screen.getByRole("combobox", { name: "Estado" }), "state-3");

    await waitFor(() => expect(updateCard).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("CardProperties — arquivar o card", () => {
  it("só arquiva o card depois da confirmação", async () => {
    const user = renderProperties();

    await user.click(screen.getByRole("button", { name: "Arquivar" }));
    expect(updateCard).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog", { name: "Arquivar o card?" });
    await user.click(within(dialog).getByRole("button", { name: "Arquivar" }));

    await waitFor(() => expect(updateCard).toHaveBeenCalled());
    expect(vi.mocked(updateCard).mock.calls[0][0]).toEqual({ cardId: "card-1", isArchived: true });
  });

  it("desarquiva na hora, sem pedir confirmação", async () => {
    const user = renderProperties({ ...card, isArchived: true });

    await user.click(screen.getByRole("button", { name: "Desarquivar" }));

    await waitFor(() => expect(updateCard).toHaveBeenCalled());
    expect(vi.mocked(updateCard).mock.calls[0][0]).toEqual({ cardId: "card-1", isArchived: false });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
