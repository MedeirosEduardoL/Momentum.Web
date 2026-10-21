import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/test/query-wrapper";
import { getEpic, updateEpic } from "../api/epic.service";
import type { Epic } from "../model/types/feature.types";
import { EditEpicForm } from "./edit-epic-form";

vi.mock("../api/feature.service");
vi.mock("../api/epic.service");

const epic: Epic = {
  id: "epic-1",
  projectId: "project-1",
  title: "Lista de cards",
  description: "Para a v1.0.0.",
  progress: 25,
  state: "in_progress",
  featureCount: 1,
  cardCount: 3,
};
const onSaved = vi.fn();

beforeEach(() => {
  vi.mocked(getEpic).mockReset().mockResolvedValue(epic);
  vi.mocked(updateEpic).mockReset().mockResolvedValue(epic);
  onSaved.mockClear();
});

describe("EditEpicForm", () => {
  it("começa com o epic e grava o título e a descrição", async () => {
    render(
      <EditEpicForm
        epicId="epic-1"
        backLink={<a href="/epics/epic-1">Voltar para o epic</a>}
        onSaved={onSaved}
      />,
      { wrapper: createQueryWrapper().wrapper }
    );
    const user = userEvent.setup();
    const title = await screen.findByRole("textbox", { name: "Título" });

    expect(screen.getByRole("heading", { level: 1, name: "Editar epic" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Descrição" })).toHaveValue("Para a v1.0.0.");

    await user.clear(title);
    await user.type(title, "Listas");
    await user.click(screen.getByRole("button", { name: "Salvar epic" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(vi.mocked(updateEpic).mock.calls[0][0]).toEqual({
      epicId: "epic-1",
      title: "Listas",
      description: "Para a v1.0.0.",
    });
  });
});
