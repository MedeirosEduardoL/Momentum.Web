import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

type User = ReturnType<typeof userEvent.setup>;

const onConfirm = vi.fn<() => void>();
const onCancel = vi.fn<() => void>();

function renderDialog(open = true) {
  render(
    <ConfirmDialog
      open={open}
      title="Concluir MOM-12?"
      description="O card tem 2 tasks abertas, que serão concluídas."
      confirmLabel="Concluir"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );

  return userEvent.setup();
}

beforeEach(() => {
  onConfirm.mockClear();
  onCancel.mockClear();
});

describe("ConfirmDialog", () => {
  it("mostra a pergunta e a consequência, sem fazer nada sozinho", () => {
    renderDialog();

    expect(screen.getByRole("dialog", { name: "Concluir MOM-12?" })).toBeVisible();
    expect(screen.getByText("O card tem 2 tasks abertas, que serão concluídas.")).toBeVisible();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("confirma no botão de confirmar", async () => {
    const user = renderDialog();

    await user.click(screen.getByRole("button", { name: "Concluir" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it.each([
    ["no Voltar", (user: User) => user.click(screen.getByRole("button", { name: "Voltar" }))],
    ["no X", (user: User) => user.click(screen.getByRole("button", { name: "Fechar" }))],
    ["no Esc", (user: User) => user.keyboard("{Escape}")],
  ])("desiste %s", async (_case, cancel) => {
    const user = renderDialog();

    await cancel(user);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("não aparece fechado", () => {
    renderDialog(false);

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
