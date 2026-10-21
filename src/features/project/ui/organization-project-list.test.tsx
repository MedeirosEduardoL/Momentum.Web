import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import type { Project } from "../model/types/project.types";
import { OrganizationProjectList } from "./organization-project-list";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const createdProjectDto = {
  project_id: "project-2",
  name: "Chamados",
  key: "CHA",
  role: "administrator",
};

const responses: Record<string, unknown> = {
  "/api/v1/projects": [{ project_id: "project-1", name: "Momentum", key: "MOM", role: "member" }],
  "/api/v1/organizations/me": {
    organization_id: "organization-1",
    name: "Exemplo",
    role: "administrator",
    ai_enabled: false,
  },
};

const renderNextStep = vi.fn((project: Project, finish: () => void) => (
  <div role="region" aria-label={`Próximo passo de ${project.name}`}>
    <button type="button" onClick={finish}>
      Terminar
    </button>
  </div>
));

function renderList() {
  render(
    <OrganizationProjectList
      renderNameLink={project => <a href={`/projetos/${project.id}/boards`}>{project.name}</a>}
      renderActions={project => <a href={`/time/${project.id}`}>Time</a>}
      renderNextStep={renderNextStep}
    />,
    { wrapper: createQueryWrapper().wrapper }
  );

  return userEvent.setup();
}

async function createProject(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Novo projeto" }));
  const dialog = within(await screen.findByRole("dialog", { name: "Novo projeto" }));
  await user.type(dialog.getByRole("textbox", { name: "Nome do projeto" }), "Chamados");
  await user.type(dialog.getByRole("textbox", { name: /Chave do projeto/ }), "cha");
  await user.click(dialog.getByRole("button", { name: "Criar projeto" }));
}

beforeEach(() => {
  vi.mocked(api.get)
    .mockReset()
    .mockImplementation((path: string) =>
      path in responses
        ? Promise.resolve({ data: responses[path] })
        : Promise.reject(apiError(404, "NotFound", `Sem resposta simulada para ${path}.`))
    );
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: createdProjectDto });
  renderNextStep.mockClear();
});

describe("OrganizationProjectList — lista", () => {
  it("mostra o nome de cada projeto com o link que a página entrega", async () => {
    renderList();

    expect(await screen.findByRole("link", { name: "Momentum" })).toHaveAttribute(
      "href",
      "/projetos/project-1/boards"
    );
    expect(screen.getByRole("link", { name: "Time" })).toBeVisible();
  });
});

describe("OrganizationProjectList — depois de criar o projeto", () => {
  it("fecha o formulário do projeto e mostra o passo seguinte com o projeto criado", async () => {
    const user = renderList();

    await createProject(user);

    expect(await screen.findByRole("region", { name: "Próximo passo de Chamados" })).toBeVisible();
    expect(screen.queryByRole("dialog", { name: "Novo projeto" })).toBeNull();
    expect(renderNextStep.mock.calls[0][0]).toEqual({
      id: "project-2",
      name: "Chamados",
      key: "CHA",
      role: "administrator",
    });
  });

  it("some com o passo seguinte quando ele termina, e não o mostra de novo", async () => {
    const user = renderList();
    await createProject(user);

    await user.click(await screen.findByRole("button", { name: "Terminar" }));

    await waitFor(() =>
      expect(screen.queryByRole("region", { name: "Próximo passo de Chamados" })).toBeNull()
    );
    expect(screen.getByRole("button", { name: "Novo projeto" })).toBeVisible();
  });

  it("não mostra o passo seguinte enquanto nenhum projeto foi criado", async () => {
    renderList();

    expect(await screen.findByRole("button", { name: "Novo projeto" })).toBeVisible();
    expect(renderNextStep).not.toHaveBeenCalled();
  });
});
