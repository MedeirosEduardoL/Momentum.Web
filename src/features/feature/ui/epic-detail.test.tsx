import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/test/query-wrapper";
import { getEpic } from "../api/epic.service";
import { listFeatures } from "../api/feature.service";
import type { Epic, FeatureSummary } from "../model/types/feature.types";
import { EpicDetail } from "./epic-detail";

vi.mock("../api/feature.service");
vi.mock("../api/epic.service");

const HOSTILE =
  '**forte** <img src="x" onerror="alert(1)">\n\n<script>window.injected = true</script>';

const epic: Epic = {
  id: "epic-1",
  projectId: "project-1",
  title: "Lista de cards",
  description: HOSTILE,
  progress: 25,
  state: "in_progress",
  featureCount: 1,
  cardCount: 3,
};

const featureInEpic: FeatureSummary = {
  id: "feature-1",
  projectId: "project-1",
  epicId: "epic-1",
  title: "Filtros da lista",
  progress: 40,
  state: "in_progress",
  cardCount: 3,
};

const featureElsewhere: FeatureSummary = {
  ...featureInEpic,
  id: "feature-2",
  epicId: null,
  title: "Colunas do board",
};

function renderEpicDetail() {
  return render(
    <EpicDetail
      epicId="epic-1"
      editLink={<a href="/epics/epic-1/editar">Editar</a>}
      renderBackLink={() => <a href="/features">Voltar</a>}
      renderNewFeatureLink={shown => (
        <a href={`/epics/${shown.id}/features/nova`}>Nova feature em {shown.title}</a>
      )}
      renderFeatureLink={feature => <a href={`/features/${feature.id}`}>{feature.title}</a>}
      renderAttachments={shown => <p>Anexos de {shown.title}</p>}
      renderCardsLink={feature => <a href={`/cards?feature=${feature.id}`}>Cards</a>}
    />,
    { wrapper: createQueryWrapper().wrapper }
  );
}

beforeEach(() => {
  vi.mocked(getEpic).mockReset().mockResolvedValue(epic);
  vi.mocked(listFeatures).mockReset().mockResolvedValue([featureInEpic, featureElsewhere]);
});

describe("EpicDetail", () => {
  it("mostra a descrição do epic como markdown sanitizado", async () => {
    const { container } = renderEpicDetail();

    expect(await screen.findByText("forte")).toHaveProperty("tagName", "STRONG");
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
    expect(container.querySelector("[src]")).toBeNull();
    expect(container.textContent).not.toContain("window.injected");
  });

  it("mostra o resumo do epic e só as features dele, com o link de cada uma", async () => {
    renderEpicDetail();

    expect(await screen.findByRole("heading", { level: 1, name: "Lista de cards" })).toBeVisible();
    expect(screen.getByText("Em andamento · Progresso de 25% · 1 feature · 3 cards")).toBeVisible();

    const features = within(await screen.findByRole("list"));

    expect(features.getByRole("link", { name: "Filtros da lista" })).toHaveAttribute(
      "href",
      "/features/feature-1"
    );
    expect(features.getByText("Em andamento · Progresso de 40% · 3 cards")).toBeVisible();
    expect(screen.queryByText("Colunas do board")).toBeNull();
  });

  it("leva às telas de editar o epic e de criar uma feature dentro dele", async () => {
    renderEpicDetail();

    expect(await screen.findByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/epics/epic-1/editar"
    );
    expect(screen.getByRole("link", { name: "Nova feature em Lista de cards" })).toHaveAttribute(
      "href",
      "/epics/epic-1/features/nova"
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("diz que o epic ainda não tem feature", async () => {
    vi.mocked(listFeatures).mockResolvedValue([featureElsewhere]);
    renderEpicDetail();

    expect(await screen.findByText("Nenhuma feature neste epic.")).toBeVisible();
  });
});
