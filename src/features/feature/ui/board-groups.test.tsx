import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/test/query-wrapper";
import { listBoardEpics } from "../api/epic.service";
import { listBoardFeatures } from "../api/feature.service";
import type { EpicSummary, FeatureSummary } from "../model/types/feature.types";
import { BoardGroups, type GroupLevel } from "./board-groups";

vi.mock("../api/feature.service");
vi.mock("../api/epic.service");

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

function renderGroups(level: GroupLevel, isList = false) {
  render(
    <BoardGroups
      boardId="board-1"
      level={level}
      isList={isList}
      newEpicLink={<a href="/projetos/project-1/epics/novo">Novo epic</a>}
      newFeatureWithoutEpicLink={<a href="/projetos/project-1/features/nova">Nova feature</a>}
      renderEpicLink={shown => <a href={`/epics/${shown.id}`}>{shown.title}</a>}
      renderNewFeatureLink={shown => (
        <a href={`/epics/${shown.id}/features/nova`}>Nova feature em {shown.title}</a>
      )}
      renderFeatureLink={shown => <a href={`/features/${shown.id}`}>{shown.title}</a>}
      renderCardsLink={shown => <a href={`/boards?feature=${shown.id}`}>Cards</a>}
    />,
    { wrapper: createQueryWrapper().wrapper }
  );
}

beforeEach(() => {
  vi.mocked(listBoardEpics).mockReset().mockResolvedValue([epic]);
  vi.mocked(listBoardFeatures).mockReset().mockResolvedValue([feature]);
});

describe("BoardGroups", () => {
  it("lê as features e os epics do board, não os do projeto", async () => {
    renderGroups("features");

    await screen.findByRole("group", { name: "Board de features" });
    expect(listBoardFeatures).toHaveBeenCalledWith("board-1");
    expect(listBoardEpics).toHaveBeenCalledWith("board-1");
  });

  it("mostra as features num board roxo, na coluna do estado derivado, com o epic e o progresso", async () => {
    renderGroups("features");

    const board = within(await screen.findByRole("group", { name: "Board de features" }));
    const inProgress = within(board.getByRole("region", { name: "Em andamento" }));
    const link = inProgress.getByRole("link", { name: "Filtros da lista" });
    expect(link).toHaveAttribute("href", "/features/feature-1");
    expect(link.closest("li")).toHaveClass("border-l-type-feature");
    expect(inProgress.getByText("Lista de cards · 3 cards")).toBeVisible();
    expect(
      inProgress.getByRole("progressbar", { name: "Progresso de Filtros da lista" })
    ).toHaveAttribute("aria-valuenow", "40");
  });

  it("mostra os epics num board dourado", async () => {
    renderGroups("epics");

    const board = within(await screen.findByRole("group", { name: "Board de epics" }));
    const link = board.getByRole("link", { name: "Lista de cards" });
    expect(link).toHaveAttribute("href", "/epics/epic-1");
    expect(link.closest("li")).toHaveClass("border-l-type-epic");
  });

  it("vista como lista, mostra a hierarquia do board, com criar epic e feature em telas próprias", async () => {
    renderGroups("features", true);

    expect(
      await screen.findByRole("link", { name: "Nova feature em Lista de cards" })
    ).toHaveAttribute("href", "/epics/epic-1/features/nova");
    expect(screen.getByRole("link", { name: "Novo epic" })).toHaveAttribute(
      "href",
      "/projetos/project-1/epics/novo"
    );
    expect(screen.getByRole("link", { name: "Cards" })).toHaveAttribute(
      "href",
      "/boards?feature=feature-1"
    );
    expect(screen.queryByRole("group", { name: "Board de features" })).toBeNull();
  });
});
