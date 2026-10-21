import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ActionMenu } from "./action-menu";

function renderMenu() {
  const onEdit = vi.fn();
  const onRemove = vi.fn();
  render(
    <>
      <ActionMenu
        label="Ações do board Sprint"
        items={[
          { label: "Editar", onSelect: onEdit },
          { label: "Excluir", isDestructive: true, onSelect: onRemove },
        ]}
      />
      <p>Fora do menu</p>
    </>
  );

  return { user: userEvent.setup(), onEdit, onRemove };
}

describe("ActionMenu", () => {
  it("abre o menu no botão de três pontos, com o foco no primeiro item", async () => {
    const { user } = renderMenu();

    await user.click(screen.getByRole("button", { name: "Ações do board Sprint" }));

    expect(screen.getByRole("menu", { name: "Ações do board Sprint" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Editar" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Ações do board Sprint" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("anda pelos itens com as setas, de volta ao início depois do último", async () => {
    const { user } = renderMenu();
    await user.click(screen.getByRole("button", { name: "Ações do board Sprint" }));

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Excluir" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Editar" })).toHaveFocus();
  });

  it("executa o item escolhido, fecha e devolve o foco ao botão", async () => {
    const { user, onRemove } = renderMenu();
    await user.click(screen.getByRole("button", { name: "Ações do board Sprint" }));

    await user.click(screen.getByRole("menuitem", { name: "Excluir" }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getByRole("button", { name: "Ações do board Sprint" })).toHaveFocus();
  });

  it("fecha no Esc e no clique fora, sem executar nada", async () => {
    const { user, onEdit, onRemove } = renderMenu();
    await user.click(screen.getByRole("button", { name: "Ações do board Sprint" }));

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Ações do board Sprint" }));
    await user.click(screen.getByText("Fora do menu"));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(onEdit).not.toHaveBeenCalled();
    expect(onRemove).not.toHaveBeenCalled();
  });
});
