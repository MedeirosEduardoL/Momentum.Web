import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/features/project";
import { api } from "@/shared/api/client";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { FirstBoardDialog } from "./first-board-dialog";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const project: Project = { id: "project-1", name: "Momentum", key: "MOM", role: "administrator" };

const NO_CRITERIA = {
  card_types: [],
  priorities: [],
  assignee_ids: [],
  feature_ids: [],
  epic_ids: [],
};

const responses: Record<string, unknown> = {
  "/api/v1/projects/project-1/members": [
    { user_id: "user-1", name: "Ana Souza", email: "ana@exemplo.test", role: "administrator" },
  ],
  "/api/v1/features": [],
  "/api/v1/epics": [],
};

const onFinished = vi.fn<() => void>();

function renderDialog() {
  render(<FirstBoardDialog project={project} onFinished={onFinished} />, {
    wrapper: createQueryWrapper().wrapper,
  });

  return userEvent.setup();
}

beforeEach(() => {
  vi.mocked(api.get)
    .mockReset()
    .mockImplementation((path: string) =>
      path in responses
        ? Promise.resolve({ data: responses[path] })
        : Promise.reject(apiError(404, "NotFound", `Sem resposta simulada para ${path}.`))
    );
  vi.mocked(api.post)
    .mockReset()
    .mockResolvedValue({
      data: {
        board_id: "board-1",
        project_id: "project-1",
        name: "Todos os cards",
        filter: NO_CRITERIA,
        created_at: "2026-10-17T09:00:00Z",
        updated_at: "2026-10-17T09:00:00Z",
      },
    });
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
  onFinished.mockClear();
});

describe("FirstBoardDialog", () => {
  it("abre o formulário de board com o nome Todos os cards e nenhum critério marcado", async () => {
    renderDialog();

    const dialog = within(await screen.findByRole("dialog", { name: "Crie o primeiro board" }));

    expect(dialog.getByText(/O projeto Momentum foi criado/)).toBeVisible();
    expect(await dialog.findByRole("textbox", { name: "Nome" })).toHaveValue("Todos os cards");
    expect(dialog.getAllByRole("checkbox").length).toBeGreaterThan(0);
    expect(dialog.queryAllByRole("checkbox", { checked: true })).toEqual([]);
  });

  it("cria o board no projeto novo, avisa e termina", async () => {
    const user = renderDialog();

    await user.click(await screen.findByRole("button", { name: "Criar board" }));

    await waitFor(() => expect(onFinished).toHaveBeenCalledTimes(1));
    expect(api.post).toHaveBeenCalledWith("/api/v1/boards", {
      project_id: "project-1",
      name: "Todos os cards",
      filter: NO_CRITERIA,
    });
    expect(toast.success).toHaveBeenCalledWith("O board Todos os cards foi criado.");
  });

  it("termina sem criar board quando a pessoa pula", async () => {
    const user = renderDialog();

    await user.click(await screen.findByRole("button", { name: "Pular" }));

    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(api.post).not.toHaveBeenCalled();
  });

  it("termina sem criar board quando a pessoa fecha o diálogo", async () => {
    const user = renderDialog();

    await user.click(await screen.findByRole("button", { name: "Fechar" }));

    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(api.post).not.toHaveBeenCalled();
  });

  it("mantém o diálogo aberto e mostra a recusa do Core", async () => {
    vi.mocked(api.post).mockRejectedValue(
      apiError(422, "BoardLimitReached", "O projeto já tem o máximo de 50 boards.")
    );
    const user = renderDialog();

    await user.click(await screen.findByRole("button", { name: "Criar board" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("O projeto já tem o máximo de 50 boards.")
    );
    expect(onFinished).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Crie o primeiro board" })).toBeVisible();
  });
});
