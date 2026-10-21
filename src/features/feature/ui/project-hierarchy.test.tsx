import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/test/query-wrapper";
import { listEpics } from "../api/epic.service";
import { listFeatures } from "../api/feature.service";
import type { EpicSummary, FeatureSummary } from "../model/types/feature.types";
import { ProjectHierarchy } from "./project-hierarchy";

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

function renderHierarchy() {
  render(
    <ProjectHierarchy
      projectId="project-1"
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
}

beforeEach(() => {
  vi.mocked(listEpics).mockReset().mockResolvedValue([epic]);
  vi.mocked(listFeatures).mockReset().mockResolvedValue([feature]);
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
    expect(screen.getByRole("link", { name: "Nova feature" })).toHaveAttribute(
      "href",
      "/projetos/project-1/features/nova"
    );
    expect(screen.queryByRole("button", { name: /Nov[ao]/ })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
