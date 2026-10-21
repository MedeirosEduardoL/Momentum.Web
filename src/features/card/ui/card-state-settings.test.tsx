import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { apiError } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { CardStateSettings } from "./card-state-settings";

vi.mock("@/shared/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const statesDto = [
  { card_state_id: "state-1", name: "Novo", category: "to_do", position: 1 },
  { card_state_id: "state-2", name: "Em andamento", category: "in_progress", position: 2 },
  { card_state_id: "state-3", name: "Concluído", category: "done", position: 3 },
];

function renderStates(canAdminister = true) {
  vi.mocked(api.get).mockResolvedValue({ data: statesDto });
  render(
    <CardStateSettings
      projectId="project-1"
      projectName="Momentum"
      canAdminister={canAdminister}
    />,
    {
      wrapper: createQueryWrapper().wrapper,
    }
  );

  return userEvent.setup();
}

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset().mockResolvedValue({ data: statesDto[0] });
  vi.mocked(api.patch).mockReset().mockResolvedValue({ data: statesDto[0] });
  vi.mocked(api.delete).mockReset().mockResolvedValue({ data: null });
  vi.mocked(toast.error).mockClear();
});

describe("CardStateSettings", () => {
  it("mostra os estados na ordem do fluxo, com a categoria de cada um", async () => {
    renderStates();

    const rows = await screen.findAllByRole("listitem");

    expect(rows.map(row => row.firstElementChild?.textContent)).toEqual([
      "Novo",
      "Em andamento",
      "Concluído",
    ]);
    expect(within(rows[0]).getByText("A fazer")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Estados de Momentum" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Subir Novo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Descer Concluído" })).toBeDisabled();
  });

  it("cria um estado com o nome e a categoria escolhidos", async () => {
    const user = renderStates();

    await user.click(await screen.findByRole("button", { name: "Novo estado" }));
    const dialog = await screen.findByRole("dialog", { name: "Novo estado" });
    await user.type(within(dialog).getByRole("textbox", { name: "Nome" }), "Em revisão");
    await user.selectOptions(
      within(dialog).getByRole("combobox", { name: "Categoria" }),
      "in_progress"
    );
    await user.click(within(dialog).getByRole("button", { name: "Salvar estado" }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/api/v1/card-states", {
        project_id: "project-1",
        name: "Em revisão",
        category: "in_progress",
      })
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("põe no nome a recusa do Core para nome repetido", async () => {
    vi.mocked(api.post).mockRejectedValue(
      apiError(409, "CardStateNameAlreadyUsed", "Já existe um estado com esse nome no projeto.", {
        property: "name",
      })
    );
    const user = renderStates();

    await user.click(await screen.findByRole("button", { name: "Novo estado" }));
    const dialog = await screen.findByRole("dialog", { name: "Novo estado" });
    await user.type(within(dialog).getByRole("textbox", { name: "Nome" }), "Novo");
    await user.click(within(dialog).getByRole("button", { name: "Salvar estado" }));

    expect(
      await within(dialog).findByText("Já existe um estado com esse nome no projeto.")
    ).toBeVisible();
  });

  it("muda a posição de um estado no fluxo", async () => {
    const user = renderStates();

    await user.click(await screen.findByRole("button", { name: "Descer Novo" }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/api/v1/card-states/state-1", {
        name: null,
        category: undefined,
        position: 2,
      })
    );
  });

  it("exclui o estado só depois da confirmação e mostra a recusa do estado em uso", async () => {
    vi.mocked(api.delete).mockRejectedValue(
      apiError(409, "CardStateInUse", "Mude o estado dos cards antes de excluir este.")
    );
    const user = renderStates();

    const rows = await screen.findAllByRole("listitem");
    await user.click(within(rows[1]).getByRole("button", { name: "Excluir" }));
    expect(api.delete).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog", { name: "Excluir o estado Em andamento?" });
    await user.click(within(dialog).getByRole("button", { name: "Excluir estado" }));

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/api/v1/card-states/state-2"));
    expect(toast.error).toHaveBeenCalledWith("Mude o estado dos cards antes de excluir este.");
  });

  it("mostra os estados sem ações a quem não administra o projeto", async () => {
    renderStates(false);

    expect(await screen.findAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
