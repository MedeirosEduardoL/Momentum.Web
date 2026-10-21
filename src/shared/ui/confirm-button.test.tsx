import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmButton } from "./confirm-button";

function renderConfirmButton(onConfirm: () => Promise<unknown>) {
  render(
    <ConfirmButton
      title="Remover Bia Lima da organização?"
      description="Esta pessoa sai de todos os times."
      confirmLabel="Remover agora"
      onConfirm={onConfirm}
    >
      Remover
    </ConfirmButton>
  );

  return userEvent.setup();
}

describe("ConfirmButton", () => {
  it("não executa a ação no primeiro clique: abre o pedido de confirmação", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = renderConfirmButton(onConfirm);

    await user.click(screen.getByRole("button", { name: "Remover" }));

    expect(screen.getByRole("dialog", { name: "Remover Bia Lima da organização?" })).toBeVisible();
    expect(screen.getByText("Esta pessoa sai de todos os times.")).toBeVisible();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("executa a ação e fecha quando a pessoa confirma", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = renderConfirmButton(onConfirm);

    await user.click(screen.getByRole("button", { name: "Remover" }));
    await user.click(screen.getByRole("button", { name: "Remover agora" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("fecha sem executar a ação quando a pessoa volta atrás", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = renderConfirmButton(onConfirm);

    await user.click(screen.getByRole("button", { name: "Remover" }));
    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("mantém o pedido aberto, com a confirmação ocupada, enquanto a ação não termina", async () => {
    let finishAction = () => {};
    const onConfirm = vi.fn(
      () =>
        new Promise<void>(resolve => {
          finishAction = resolve;
        })
    );
    const user = renderConfirmButton(onConfirm);

    await user.click(screen.getByRole("button", { name: "Remover" }));
    await user.click(screen.getByRole("button", { name: "Remover agora" }));

    expect(screen.getByRole("button", { name: "Remover agora" })).toBeDisabled();

    finishAction();

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
