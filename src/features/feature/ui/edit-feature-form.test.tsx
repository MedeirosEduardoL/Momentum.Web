import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { getFeature, updateFeature } from "../api/feature.service";
import type { Feature } from "../model/types/feature.types";
import { EditFeatureForm } from "./edit-feature-form";

vi.mock("../api/feature.service");
vi.mock("../api/epic.service");

const HOSTILE = '**forte** <img src="x" onerror="alert(1)"><script>window.injected = true</script>';

const feature: Feature = {
  id: "feature-1",
  projectId: "project-1",
  epicId: "epic-1",
  title: "Filtros da lista",
  description: HOSTILE,
  progress: 40,
  state: "in_progress",
  cardCount: 3,
};
const onSaved = vi.fn();

function renderEditFeatureForm() {
  const view = render(
    <EditFeatureForm
      featureId="feature-1"
      backLink={<a href="/features/feature-1">Voltar para a feature</a>}
      onSaved={onSaved}
    />,
    { wrapper: createQueryWrapper().wrapper }
  );

  return { ...view, user: userEvent.setup() };
}

beforeEach(() => {
  vi.mocked(getFeature).mockReset().mockResolvedValue(feature);
  vi.mocked(updateFeature).mockReset().mockResolvedValue(feature);
  onSaved.mockClear();
});

describe("EditFeatureForm", () => {
  it("começa com o título e a descrição da feature, a descrição como texto do campo", async () => {
    const { container } = renderEditFeatureForm();

    expect(await screen.findByRole("heading", { level: 1, name: "Editar feature" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Título" })).toHaveValue("Filtros da lista");
    expect(screen.getByRole("textbox", { name: "Descrição" })).toHaveValue(HOSTILE);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
  });

  it("grava o título e a descrição e avisa que gravou", async () => {
    const { user } = renderEditFeatureForm();
    const description = await screen.findByRole("textbox", { name: "Descrição" });

    await user.clear(description);
    await user.type(description, "Por tipo e por estado.");
    await user.click(screen.getByRole("button", { name: "Salvar feature" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(vi.mocked(updateFeature).mock.calls[0][0]).toEqual({
      featureId: "feature-1",
      title: "Filtros da lista",
      description: "Por tipo e por estado.",
    });
  });

  it("não grava sem título", async () => {
    const { user } = renderEditFeatureForm();
    const title = await screen.findByRole("textbox", { name: "Título" });

    await user.clear(title);
    await user.click(screen.getByRole("button", { name: "Salvar feature" }));

    expect(await screen.findByText("Informe o título.")).toBeVisible();
    expect(updateFeature).not.toHaveBeenCalled();
  });

  it("mostra a mensagem do Core quando a feature não existe para a pessoa", async () => {
    vi.mocked(getFeature).mockRejectedValue(
      apiError(404, "FeatureNotFound", "Feature não encontrada.")
    );
    renderEditFeatureForm();

    expect(await screen.findByText("Não foi possível carregar a feature")).toBeVisible();
    expect(screen.getByText("Feature não encontrada.")).toBeVisible();
  });
});
