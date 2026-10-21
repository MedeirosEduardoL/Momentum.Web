import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { CreateCardForm } from "./create-card-form";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const stateDto = { card_state_id: "state-1", name: "Novo", category: "to_do", position: 1 };

const featuresDto = [
  {
    feature_id: "feature-1",
    project_id: "project-1",
    epic_id: null,
    title: "Filtros da lista",
    progress: 0,
    state: "to_do",
    card_count: 0,
  },
];

const createdCardDto = {
  card_id: "card-9",
  project_id: "project-1",
  identifier: "MOM-9",
  card_type: "user_story",
  title: "Filtrar por feature",
  state: stateDto,
  priority: "medium",
  assignee: null,
  feature_id: "feature-1",
  progress: 0,
  task_count: 0,
  done_task_count: 0,
  subitem_counts: {
    task: { total_count: 0, done_count: 0 },
    bug: { total_count: 0, done_count: 0 },
    impediment: { total_count: 0, done_count: 0 },
  },
  archived: false,
  updated_at: "2026-10-17T12:00:00Z",
  description: "",
  user_story: { acceptance_criteria: [] },
  spike: null,
  issue: null,
  tech_debt: null,
  created_at: "2026-10-17T12:00:00Z",
};

const onCreated = vi.fn();

type FeaturesResponse = () => Promise<unknown>;

function simulateCore(features: FeaturesResponse) {
  const responses: Record<string, unknown> = {
    "/api/v1/projects": [{ project_id: "project-1", name: "Momentum", key: "MOM", role: "member" }],
    "/api/v1/card-states": [stateDto],
    "/api/v1/projects/project-1/members": [],
  };

  vi.mocked(api.get).mockImplementation((path: string) => {
    if (path === "/api/v1/features") {
      return features();
    }

    return path in responses
      ? Promise.resolve({ data: responses[path] })
      : Promise.reject(apiError(404, "NotFound", `Sem resposta simulada para ${path}.`));
  });
}

function renderCreateCardForm(
  features: FeaturesResponse = () => Promise.resolve({ data: featuresDto })
) {
  simulateCore(features);
  render(
    <CreateCardForm
      projectId="project-1"
      backLink={<a href="/">Voltar</a>}
      onCreated={onCreated}
    />,
    { wrapper: createQueryWrapper().wrapper }
  );

  return userEvent.setup();
}

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: createdCardDto });
  onCreated.mockClear();
});

describe("CreateCardForm — feature do card novo", () => {
  it("oferece as features do projeto, começando sem feature", async () => {
    renderCreateCardForm();

    const feature = await screen.findByRole("combobox", { name: "Feature" });

    await waitFor(() => expect(feature).toBeEnabled());
    expect(
      within(feature)
        .getAllByRole("option")
        .map(option => option.textContent)
    ).toEqual(["Sem feature", "Filtros da lista"]);
    expect(feature).toHaveValue("");
  });

  it("cria o card já dentro da feature escolhida", async () => {
    const user = renderCreateCardForm();
    const feature = await screen.findByRole("combobox", { name: "Feature" });
    await waitFor(() => expect(feature).toBeEnabled());

    await user.type(screen.getByRole("textbox", { name: "Título" }), "Filtrar por feature");
    await user.selectOptions(feature, "feature-1");
    await user.click(screen.getByRole("button", { name: "Criar card" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.post).mock.calls[0]).toEqual([
      "/api/v1/cards",
      expect.objectContaining({ title: "Filtrar por feature", feature_id: "feature-1" }),
    ]);
  });

  it("cria o card sem feature quando nenhuma foi escolhida", async () => {
    const user = renderCreateCardForm();
    await screen.findByRole("combobox", { name: "Feature" });

    await user.type(screen.getByRole("textbox", { name: "Título" }), "Filtrar por feature");
    await user.click(screen.getByRole("button", { name: "Criar card" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.post).mock.calls[0][1]).toMatchObject({ feature_id: null });
  });

  it("deixa criar sem feature quando as features não carregam", async () => {
    const user = renderCreateCardForm(() =>
      Promise.reject(apiError(503, "ServiceUnavailable", "Serviço indisponível."))
    );

    expect(await screen.findByText("Não foi possível carregar as features.")).toBeVisible();

    await user.type(screen.getByRole("textbox", { name: "Título" }), "Filtrar por feature");
    await user.click(screen.getByRole("button", { name: "Criar card" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.post).mock.calls[0][1]).toMatchObject({ feature_id: null });
  });
});
