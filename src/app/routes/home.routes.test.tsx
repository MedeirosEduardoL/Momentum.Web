import { RouterProvider } from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFirstBoardStore } from "@/app/stores/first-board.store";
import { api } from "@/shared/api/client";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { router } from "./index";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  session: { open: vi.fn(), close: vi.fn() },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const projectDto = { project_id: "project-1", name: "Momentum", key: "MOM", role: "administrator" };

const NO_CRITERIA = {
  card_types: [],
  priorities: [],
  assignee_ids: [],
  feature_ids: [],
  epic_ids: [],
};

const LAZY_CHUNK = { timeout: 10_000 };

let projects: unknown[] = [];

const responses: Record<string, () => unknown> = {
  "/api/v1/accounts/me": () => ({
    user_id: "user-1",
    name: "Ana Souza",
    email: "ana@exemplo.test",
  }),
  "/api/v1/organizations/me": () => ({
    organization_id: "organization-1",
    name: "Exemplo",
    role: "administrator",
    ai_enabled: false,
  }),
  "/api/v1/projects": () => projects,
  "/api/v1/projects/project-1/members": () => [
    { user_id: "user-1", name: "Ana Souza", email: "ana@exemplo.test", role: "administrator" },
  ],
  "/api/v1/features": () => [],
  "/api/v1/epics": () => [],
};

function simulateCore() {
  vi.mocked(api.get).mockImplementation((path: string) =>
    path in responses
      ? Promise.resolve({ data: responses[path]() })
      : Promise.reject(apiError(404, "NotFound", `Sem resposta simulada para ${path}.`))
  );
  vi.mocked(api.post).mockImplementation((path: string) => {
    if (path === "/api/v1/projects") {
      projects = [projectDto];
      return Promise.resolve({ data: projectDto });
    }

    return Promise.resolve({
      data: {
        board_id: "board-1",
        project_id: "project-1",
        name: "Todos os cards",
        filter: NO_CRITERIA,
        created_at: "2026-10-19T09:00:00Z",
        updated_at: "2026-10-19T09:00:00Z",
      },
    });
  });
}

function renderApp() {
  render(<RouterProvider router={router} />, { wrapper: createQueryWrapper().wrapper });

  return userEvent.setup();
}

async function createFirstProject(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    await screen.findByRole("textbox", { name: "Nome do projeto" }, LAZY_CHUNK),
    "Momentum"
  );
  await user.type(screen.getByRole("textbox", { name: /Chave do projeto/ }), "mom");
  await user.click(screen.getByRole("button", { name: "Criar projeto" }));
}

beforeEach(() => {
  projects = [];
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset();
  vi.mocked(toast.success).mockClear();
  useFirstBoardStore.getState().clearPending();
  simulateCore();
  router.history.replace("/");
});

describe("primeiro acesso até o primeiro board", () => {
  it("leva a / quem cria o primeiro projeto e abre lá o diálogo do primeiro board", async () => {
    const user = renderApp();

    await createFirstProject(user);

    const dialog = within(
      await screen.findByRole("dialog", { name: "Crie o primeiro board" }, LAZY_CHUNK)
    );
    expect(router.state.location.pathname).toBe("/");
    expect(dialog.getByText(/O projeto Momentum foi criado/)).toBeVisible();
    expect(await dialog.findByRole("textbox", { name: "Nome" })).toHaveValue("Todos os cards");
  });

  it("cria o board pelo diálogo, avisa e deixa a pessoa em /", async () => {
    const user = renderApp();
    await createFirstProject(user);

    const dialog = within(
      await screen.findByRole("dialog", { name: "Crie o primeiro board" }, LAZY_CHUNK)
    );
    await user.click(await dialog.findByRole("button", { name: "Criar board" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(api.post).toHaveBeenCalledWith("/api/v1/boards", {
      project_id: "project-1",
      name: "Todos os cards",
      filter: NO_CRITERIA,
    });
    expect(toast.success).toHaveBeenCalledWith("O board Todos os cards foi criado.");
    expect(router.state.location.pathname).toBe("/");
    expect(useFirstBoardStore.getState().pendingProject).toBeNull();
  });

  it("não volta a abrir o diálogo depois que a pessoa pula", async () => {
    const user = renderApp();
    await createFirstProject(user);

    const dialog = within(
      await screen.findByRole("dialog", { name: "Crie o primeiro board" }, LAZY_CHUNK)
    );
    await user.click(dialog.getByRole("button", { name: "Pular" }));
    await router.navigate({ to: "/organizacao/projetos" });
    await screen.findByRole("button", { name: "Novo projeto" }, LAZY_CHUNK);
    await router.navigate({ to: "/" });

    expect(await screen.findByRole("link", { name: "Boards de Momentum" })).toBeVisible();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(api.post).not.toHaveBeenCalledWith("/api/v1/boards", expect.anything());
  });
});

describe("nome do projeto", () => {
  it("leva ao board do projeto, na página inicial e na lista de projetos da organização", async () => {
    projects = [projectDto];
    renderApp();

    const home = within(await screen.findByRole("main"));
    expect(await home.findByRole("link", { name: "Momentum" }, LAZY_CHUNK)).toHaveAttribute(
      "href",
      "/projetos/project-1/boards"
    );

    await router.navigate({ to: "/organizacao/projetos" });

    const teamLink = await screen.findByRole("link", { name: "Time de Momentum" }, LAZY_CHUNK);
    const projectRow = teamLink.closest("li");

    if (!projectRow) {
      throw new Error("A linha do projeto não está na lista da organização.");
    }

    expect(within(projectRow).getByRole("link", { name: "Momentum" })).toHaveAttribute(
      "href",
      "/projetos/project-1/boards"
    );
  });
});
