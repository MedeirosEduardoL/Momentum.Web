import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/test/query-wrapper";
import { listEpics } from "../api/epic.service";
import { listFeatures } from "../api/feature.service";
import type { EpicSummary, FeatureSummary } from "../model/types/feature.types";
import { ProjectHierarchy, type GroupsView } from "./project-hierarchy";

vi.mock("../api/feature.service");
vi.mock("../api/epic.service");
vi.mock("@/features/project", () => ({
  ProjectContent: ({
    children,
  }: {
    children: (project: { id: string; name: string }) => ReactNode;
  }) => children({ id: "project-1", name: "Momentum" }),
}));

const epic: EpicSummary = {
  id: "epic-1",
  projectId: "project-1",
  title: "Lista de cards",
  progress: 25,
  state: "in_progress",
  featureCount: 1,
  cardCount: 3,
};

const feature: FeatureSummary = {
  id: "feature-1",
  projectId: "project-1",
  epicId: "epic-1",
  title: "Filtros da lista",
  progress: 40,
  state: "in_progress",
  cardCount: 3,
};

const onViewChange = vi.fn<(view: GroupsView) => void>();

function renderHierarchy(view: GroupsView = "hierarquia") {
  render(
    <ProjectHierarchy
      projectId="project-1"
      view={view}
      onViewChange={onViewChange}
      newEpicLink={<a href="/projetos/project-1/epics/novo">Novo epic</a>}
      newFeatureWithoutEpicLink={<a href="/projetos/project-1/features/nova">Nova feature</a>}
      renderEpicLink={shown => <a href={`/epics/${shown.id}`}>{shown.title}</a>}
      renderNewFeatureLink={shown => (
        <a href={`/epics/${shown.id}/features/nova`}>Nova feature em {shown.title}</a>
      )}
      renderFeatureLink={shown => <a href={`/features/${shown.id}`}>{shown.title}</a>}
      renderCardsLink={shown => <a href={`/cards?feature=${shown.id}`}>Cards</a>}
    />,
    { wrapper: createQueryWrapper().wrapper }
  );

  return userEvent.setup();
}

beforeEach(() => {
  vi.mocked(listEpics).mockReset().mockResolvedValue([epic]);
  vi.mocked(listFeatures).mockReset().mockResolvedValue([feature]);
  onViewChange.mockClear();
});

describe("ProjectHierarchy", () => {
  it("leva às telas de criar epic e feature, sem diálogo", async () => {
    renderHierarchy();

    expect(await screen.findByRole("link", { name: "Novo epic" })).toHaveAttribute(
      "href",
      "/projetos/project-1/epics/novo"
    );
    expect(
      await screen.findByRole("link", { name: "Nova feature em Lista de cards" })
    ).toHaveAttribute("href", "/epics/epic-1/features/nova");
    expect(screen.getAllByRole("link", { name: "Nova feature" })[0]).toHaveAttribute(
      "href",
      "/projetos/project-1/features/nova"
    );
    expect(screen.queryByRole("button", { name: /Nov[ao]/ })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("mostra as features num board, na coluna do estado derivado, com o epic e o progresso", async () => {
    renderHierarchy("features");

    const board = within(await screen.findByRole("group", { name: "Board de features" }));
    const inProgress = within(board.getByRole("region", { name: "Em andamento" }));
    expect(inProgress.getByRole("link", { name: "Filtros da lista" })).toHaveAttribute(
      "href",
      "/features/feature-1"
    );
    expect(inProgress.getByText("Lista de cards · 3 cards")).toBeVisible();
    expect(
      inProgress.getByRole("progressbar", { name: "Progresso de Filtros da lista" })
    ).toHaveAttribute("aria-valuenow", "40");
    expect(
      within(board.getByRole("region", { name: "A fazer" })).getByText("Nenhuma feature aqui.")
    ).toBeVisible();
  });

  it("mostra os epics num board e troca de visão pelas abas", async () => {
    const user = renderHierarchy("epics");

    const board = within(await screen.findByRole("group", { name: "Board de epics" }));
    expect(board.getByRole("link", { name: "Lista de cards" })).toHaveAttribute(
      "href",
      "/epics/epic-1"
    );
    await user.click(screen.getByRole("tab", { name: "Hierarquia" }));

    expect(onViewChange).toHaveBeenCalledWith("hierarquia");
  });
});
