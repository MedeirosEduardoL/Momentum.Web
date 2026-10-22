import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListEpics, useListFeatures } from "@/features/feature";
import { useListProjectMembers } from "@/features/project";
import { createQueryWrapper } from "@/test/query-wrapper";
import { getCard, listCardStates } from "../api/card.service";
import { listCardRelations } from "../api/card-relation.service";
import { listCardTasks } from "../api/card-task.service";
import type { Card, CardState } from "../model/types/card.types";
import { CardDialog } from "./card-dialog";

vi.mock("../api/card.service");
vi.mock("../api/card-task.service");
vi.mock("../api/card-relation.service");
vi.mock("@/features/project", () => ({ useListProjectMembers: vi.fn() }));
vi.mock("@/features/feature", () => ({ useListFeatures: vi.fn(), useListEpics: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const fresh: CardState = { id: "state-1", name: "Novo", category: "to_do", position: 1 };
const card: Card = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "issue",
  title: "Lista de chamados vazia",
  description: "A lista aparece vazia depois do login.",
  fields: {
    type: "issue",
    stepsToReproduce: "",
    expectedBehavior: "",
    observedBehavior: "",
    severity: null,
    location: "",
  },
  state: fresh,
  priority: "high",
  assignee: null,
  featureId: null,
  progress: 0,
  taskCount: 0,
  doneTaskCount: 0,
  subitemCounts: {
    task: { total: 0, done: 0 },
    bug: { total: 0, done: 0 },
    impediment: { total: 0, done: 0 },
  },
  isArchived: false,
  createdAt: "2026-10-21T10:00:00Z",
  updatedAt: "2026-10-21T10:00:00Z",
};
const onClose = vi.fn();
const onOpenPage = vi.fn();

function emptyQuery() {
  return { data: [], isPending: false, isError: false, refetch: vi.fn() };
}

function renderDialog() {
  render(
    <CardDialog
      cardId="card-1"
      onClose={onClose}
      onOpenPage={onOpenPage}
      renderFeatureLink={() => null}
      renderEpicLink={() => null}
      renderRelatedCardLink={related => related.title}
      renderAttachments={() => <p>Painel de anexos</p>}
      renderInterviews={() => <p>Painel da entrevista</p>}
      renderBrief={() => <p>Painel do briefing</p>}
    />,
    { wrapper: createQueryWrapper().wrapper }
  );

  return userEvent.setup();
}

beforeEach(() => {
  vi.mocked(getCard).mockResolvedValue(card);
  vi.mocked(listCardStates).mockResolvedValue([fresh]);
  vi.mocked(listCardTasks).mockResolvedValue([]);
  vi.mocked(listCardRelations).mockResolvedValue([]);
  vi.mocked(useListProjectMembers).mockReturnValue(
    emptyQuery() as unknown as ReturnType<typeof useListProjectMembers>
  );
  vi.mocked(useListFeatures).mockReturnValue(
    emptyQuery() as unknown as ReturnType<typeof useListFeatures>
  );
  vi.mocked(useListEpics).mockReturnValue(
    emptyQuery() as unknown as ReturnType<typeof useListEpics>
  );
  onClose.mockClear();
  onOpenPage.mockClear();
});

describe("CardDialog", () => {
  it("abre o card numa modal, com o identificador, o título e as abas do item", async () => {
    renderDialog();

    const dialog = within(await screen.findByRole("dialog", { name: "Lista de chamados vazia" }));
    expect(dialog.getByText("MOM-12")).toBeVisible();
    expect(dialog.getAllByRole("tab").map(tab => tab.textContent)).toEqual([
      "Detalhes",
      "Relações",
      "Anexos",
      "Entrevista com IA",
      "Briefing",
    ]);
    expect(dialog.getByText("A lista aparece vazia depois do login.")).toBeVisible();
  });

  it("mostra a entrevista e os anexos em abas e fecha pelo X", async () => {
    const user = renderDialog();

    await user.click(await screen.findByRole("tab", { name: "Entrevista com IA" }));
    expect(screen.getByText("Painel da entrevista")).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Anexos" }));
    expect(screen.getByText("Painel de anexos")).toBeVisible();
    expect(screen.getByText("Painel da entrevista")).not.toBeVisible();
    await user.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("edita o card dentro da modal e volta aos detalhes ao cancelar", async () => {
    const user = renderDialog();

    await user.click(await screen.findByRole("tab", { name: "Briefing" }));
    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByRole("tab", { name: "Detalhes" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "Salvar card" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("button", { name: "Salvar card" })).toBeNull();
    expect(screen.getByRole("button", { name: "Editar" })).toBeVisible();
  });

  it("abre o card em página inteira pelo menu", async () => {
    const user = renderDialog();

    await user.click(await screen.findByRole("button", { name: "Mais ações de MOM-12" }));
    await user.click(screen.getByRole("menuitem", { name: "Abrir em página inteira" }));

    expect(onOpenPage).toHaveBeenCalledWith(card);
  });
});
