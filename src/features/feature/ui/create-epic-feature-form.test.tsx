import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { getEpic } from "../api/epic.service";
import { createFeature } from "../api/feature.service";
import type { Epic, Feature } from "../model/types/feature.types";
import { CreateEpicFeatureForm } from "./create-epic-feature-form";

vi.mock("../api/feature.service");
vi.mock("../api/epic.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const epic: Epic = {
  id: "epic-1",
  projectId: "project-1",
  title: "Lista de cards",
  description: "",
  progress: 25,
  state: "in_progress",
  featureCount: 1,
  cardCount: 3,
};
const createdFeature: Feature = {
  id: "feature-9",
  projectId: "project-1",
  epicId: "epic-1",
  title: "Filtros da lista",
  description: "Por tipo.",
  progress: 0,
  state: "to_do",
  cardCount: 0,
};
const onCreated = vi.fn();

function renderCreateEpicFeatureForm() {
  render(
    <CreateEpicFeatureForm
      epicId="epic-1"
      backLink={<a href="/epics/epic-1">Voltar para o epic</a>}
      onCreated={onCreated}
    />,
    { wrapper: createQueryWrapper().wrapper }
  );

  return userEvent.setup();
}

async function fillAndCreate(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByRole("textbox", { name: "Título" }), "Filtros da lista");
  await user.type(screen.getByRole("textbox", { name: "Descrição" }), "Por tipo.");
  await user.click(screen.getByRole("button", { name: "Criar feature" }));
}

beforeEach(() => {
  vi.mocked(getEpic).mockReset().mockResolvedValue(epic);
  vi.mocked(createFeature).mockReset().mockResolvedValue(createdFeature);
  onCreated.mockClear();
});

describe("CreateEpicFeatureForm", () => {
  it("cria a feature dentro do epic, no projeto dele, e entrega a feature criada", async () => {
    const user = renderCreateEpicFeatureForm();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Nova feature em Lista de cards" })
    ).toBeVisible();

    await fillAndCreate(user);

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(createdFeature));
    expect(vi.mocked(createFeature).mock.calls[0][0]).toEqual({
      projectId: "project-1",
      epicId: "epic-1",
      title: "Filtros da lista",
      description: "Por tipo.",
    });
  });

  it("avisa no topo quando o epic foi excluído enquanto a feature era escrita", async () => {
    vi.mocked(createFeature).mockRejectedValue(
      apiError(422, "FeatureEpicInvalid", "Este epic não existe no projeto da feature.", {
        property: "epicId",
      })
    );
    const user = renderCreateEpicFeatureForm();

    await fillAndCreate(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Este epic não existe no projeto da feature."
    );
    expect(screen.getByRole("textbox", { name: "Descrição" })).toHaveValue("Por tipo.");
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("mostra a mensagem do Core quando o epic não existe para a pessoa", async () => {
    vi.mocked(getEpic).mockRejectedValue(apiError(404, "EpicNotFound", "Epic não encontrado."));
    renderCreateEpicFeatureForm();

    expect(await screen.findByText("Não foi possível carregar o epic")).toBeVisible();
    expect(screen.getByText("Epic não encontrado.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Criar feature" })).toBeNull();
  });
});
