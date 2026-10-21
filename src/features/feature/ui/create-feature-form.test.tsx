import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/test/query-wrapper";
import { createFeature } from "../api/feature.service";
import type { Feature } from "../model/types/feature.types";
import { CreateFeatureForm } from "./create-feature-form";

vi.mock("../api/feature.service");
vi.mock("../api/epic.service");
vi.mock("@/features/project", () => ({
  ProjectContent: ({
    children,
  }: {
    children: (project: { id: string; name: string }) => ReactNode;
  }) => children({ id: "project-1", name: "Momentum" }),
}));

const createdFeature: Feature = {
  id: "feature-9",
  projectId: "project-1",
  epicId: null,
  title: "Board",
  description: "",
  progress: 0,
  state: "to_do",
  cardCount: 0,
};
const onCreated = vi.fn();

beforeEach(() => {
  vi.mocked(createFeature).mockReset().mockResolvedValue(createdFeature);
  onCreated.mockClear();
});

describe("CreateFeatureForm", () => {
  it("cria a feature sem epic numa tela própria do projeto e entrega a feature criada", async () => {
    render(
      <CreateFeatureForm
        projectId="project-1"
        backLink={<a href="/">Voltar</a>}
        onCreated={onCreated}
      />,
      { wrapper: createQueryWrapper().wrapper }
    );
    const user = userEvent.setup();

    expect(
      screen.getByRole("heading", { level: 1, name: "Nova feature em Momentum" })
    ).toBeVisible();
    expect(screen.getByText(/Ela nasce sem epic\./)).toBeVisible();

    await user.type(screen.getByRole("textbox", { name: "Título" }), "Board");
    await user.click(screen.getByRole("button", { name: "Criar feature" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(createdFeature));
    expect(vi.mocked(createFeature).mock.calls[0][0]).toEqual({
      projectId: "project-1",
      epicId: null,
      title: "Board",
      description: "",
    });
  });
});
