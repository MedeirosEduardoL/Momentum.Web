import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { listEpics } from "../api/epic.service";
import { getFeature } from "../api/feature.service";
import type { EpicSummary, Feature } from "../model/types/feature.types";
import { FeatureDetail } from "./feature-detail";

vi.mock("../api/feature.service");
vi.mock("../api/epic.service");

const HOSTILE =
  '**forte** <img src="x" onerror="alert(1)">\n\n<script>window.injected = true</script>';

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

const epic: EpicSummary = {
  id: "epic-1",
  projectId: "project-1",
  title: "Lista de cards",
  progress: 25,
  state: "in_progress",
  featureCount: 1,
  cardCount: 3,
};

function renderFeatureDetail() {
  return render(
    <FeatureDetail
      featureId="feature-1"
      editLink={<a href="/features/feature-1/editar">Editar</a>}
      renderBackLink={projectId => <a href={`/projetos/${projectId}/features`}>Voltar</a>}
      renderCardsLink={shown => <a href={`/cards?feature=${shown.id}`}>Cards</a>}
      renderAttachments={shown => <p>Anexos de {shown.title}</p>}
    />,
    { wrapper: createQueryWrapper().wrapper }
  );
}

beforeEach(() => {
  vi.mocked(getFeature).mockReset().mockResolvedValue(feature);
  vi.mocked(listEpics).mockReset().mockResolvedValue([epic]);
});

describe("FeatureDetail", () => {
  it("mostra a descrição da feature como markdown sanitizado", async () => {
    const { container } = renderFeatureDetail();

    expect(await screen.findByText("forte")).toHaveProperty("tagName", "STRONG");
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
    expect(container.querySelector("[src]")).toBeNull();
    expect(container.textContent).not.toContain("window.injected");
  });

  it("mostra o título, o estado derivado, o progresso, os cards e o epic da feature", async () => {
    renderFeatureDetail();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Filtros da lista" })
    ).toBeVisible();
    expect(screen.getByText("Em andamento · Progresso de 40% · 3 cards")).toBeVisible();
    expect(screen.getByRole("link", { name: "Cards" })).toHaveAttribute(
      "href",
      "/cards?feature=feature-1"
    );
    expect(await screen.findByRole("combobox", { name: "Epic" })).toHaveValue("epic-1");
    expect(screen.getByRole("link", { name: "Voltar" })).toHaveAttribute(
      "href",
      "/projetos/project-1/features"
    );
  });

  it("leva à tela de editar, sem diálogo na própria tela", async () => {
    renderFeatureDetail();

    expect(await screen.findByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/features/feature-1/editar"
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("diz que a feature está sem descrição", async () => {
    vi.mocked(getFeature).mockResolvedValue({ ...feature, description: "" });
    renderFeatureDetail();

    expect(await screen.findByText("Sem descrição.")).toBeVisible();
  });

  it("mostra a mensagem do Core quando a feature não existe para a pessoa", async () => {
    vi.mocked(getFeature).mockRejectedValue(
      apiError(404, "FeatureNotFound", "Feature não encontrada.")
    );
    renderFeatureDetail();

    expect(await screen.findByText("Não foi possível carregar a feature")).toBeVisible();
    expect(screen.getByText("Feature não encontrada.")).toBeVisible();
  });
});
