import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/test/query-wrapper";
import { createEpic } from "../api/epic.service";
import type { Epic } from "../model/types/feature.types";
import { CreateEpicForm } from "./create-epic-form";

vi.mock("../api/feature.service");
vi.mock("../api/epic.service");
vi.mock("@/features/project", () => ({
  ProjectContent: ({
    children,
  }: {
    children: (project: { id: string; name: string }) => ReactNode;
  }) => children({ id: "project-1", name: "Momentum" }),
}));

const createdEpic: Epic = {
  id: "epic-9",
  projectId: "project-1",
  title: "Lista de cards",
  description: "Para a **v1.0.0**.",
  progress: 0,
  state: "to_do",
  featureCount: 0,
  cardCount: 0,
};
const onCreated = vi.fn();

function renderCreateEpicForm() {
  render(
    <CreateEpicForm
      projectId="project-1"
      backLink={<a href="/">Voltar</a>}
      onCreated={onCreated}
    />,
    { wrapper: createQueryWrapper().wrapper }
  );

  return userEvent.setup();
}

beforeEach(() => {
  vi.mocked(createEpic).mockReset().mockResolvedValue(createdEpic);
  onCreated.mockClear();
});

describe("CreateEpicForm", () => {
  it("é uma tela própria do projeto, sem diálogo", () => {
    renderCreateEpicForm();

    expect(screen.getByRole("heading", { level: 1, name: "Novo epic em Momentum" })).toBeVisible();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("não perde a descrição com o Esc e cria o epic no projeto", async () => {
    const user = renderCreateEpicForm();
    await user.type(screen.getByRole("textbox", { name: "Título" }), "Lista de cards");
    await user.type(screen.getByRole("textbox", { name: "Descrição" }), "Para a **v1.0.0**.");

    await user.keyboard("{Escape}");

    expect(screen.getByRole("textbox", { name: "Descrição" })).toHaveValue("Para a **v1.0.0**.");

    await user.click(screen.getByRole("button", { name: "Criar epic" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(createdEpic));
    expect(vi.mocked(createEpic).mock.calls[0][0]).toEqual({
      projectId: "project-1",
      title: "Lista de cards",
      description: "Para a **v1.0.0**.",
    });
  });
});
