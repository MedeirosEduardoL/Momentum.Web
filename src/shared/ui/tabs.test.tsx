import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Tabs } from "./tabs";

const unmounted = vi.fn();

function Stream() {
  useState(() => () => unmounted());

  return <p>Rodada em andamento</p>;
}

function ControlledTabs() {
  const [value, setValue] = useState<"detalhes" | "entrevista" | "anexos">("detalhes");

  return (
    <Tabs
      label="Seções do card"
      value={value}
      onValueChange={setValue}
      tabs={[
        { value: "detalhes", label: "Detalhes", content: <p>Descrição do card</p> },
        { value: "entrevista", label: "Entrevista", content: <Stream /> },
        { value: "anexos", label: "Anexos", count: 2, content: <p>Lista de anexos</p> },
      ]}
    />
  );
}

describe("Tabs", () => {
  it("mostra só o painel da aba escolhida e a contagem no rótulo", () => {
    render(<ControlledTabs />);

    expect(screen.getByRole("tab", { name: "Detalhes" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Anexos 2" })).toBeVisible();
    expect(screen.getByText("Descrição do card")).toBeVisible();
    expect(screen.queryByText("Lista de anexos")).toBeNull();
  });

  it("mantém montado o painel já visitado, só escondido, ao trocar de aba", async () => {
    const user = userEvent.setup();
    render(<ControlledTabs />);

    await user.click(screen.getByRole("tab", { name: "Entrevista" }));
    expect(screen.getByText("Rodada em andamento")).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Detalhes" }));

    expect(screen.getByText("Rodada em andamento")).not.toBeVisible();
    expect(unmounted).not.toHaveBeenCalled();
  });

  it("anda entre as abas pelas setas e pelo Home e End", async () => {
    const user = userEvent.setup();
    render(<ControlledTabs />);

    await user.click(screen.getByRole("tab", { name: "Detalhes" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Entrevista" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Anexos 2" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Detalhes" })).toHaveFocus();
  });
});
