import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { CheckboxGroupField } from "./checkbox-group-field";
import type { SelectOption } from "./select-field";

type Choices = {
  colors: string[];
};

const colors: SelectOption[] = [
  { value: "red", label: "Vermelho" },
  { value: "blue", label: "Azul" },
];

function ChoicesForm({
  options,
  chosen,
  onSubmit,
}: {
  options: SelectOption[];
  chosen: string[];
  onSubmit: (choices: Choices) => void;
}) {
  const form = useForm<Choices>({ defaultValues: { colors: chosen } });

  return (
    <form onSubmit={form.handleSubmit(choices => onSubmit(choices))}>
      <CheckboxGroupField
        label="Cores"
        options={options}
        emptyText="Nenhuma cor."
        {...form.register("colors")}
      />
      <button type="submit">Salvar</button>
    </form>
  );
}

function renderChoices(options: SelectOption[], chosen: string[] = []) {
  const onSubmit = vi.fn<(choices: Choices) => void>();

  render(<ChoicesForm options={options} chosen={chosen} onSubmit={onSubmit} />);

  return { onSubmit, user: userEvent.setup() };
}

describe("CheckboxGroupField", () => {
  it("mostra as opções num grupo com o rótulo, já marcadas com o valor do formulário", () => {
    renderChoices(colors, ["blue"]);

    expect(screen.getByRole("group", { name: "Cores" })).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "Vermelho" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Azul" })).toBeChecked();
  });

  it("entrega ao formulário a lista do que ficou marcado", async () => {
    const { onSubmit, user } = renderChoices(colors, ["blue"]);

    await user.click(screen.getByRole("checkbox", { name: "Vermelho" }));
    await user.click(screen.getByRole("checkbox", { name: "Azul" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).toHaveBeenCalledWith({ colors: ["red"] });
  });

  it("entrega uma lista mesmo quando só há uma opção", async () => {
    const { onSubmit, user } = renderChoices([colors[0]]);

    await user.click(screen.getByRole("checkbox", { name: "Vermelho" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).toHaveBeenCalledWith({ colors: ["red"] });
  });

  it("diz que não há o que escolher quando não vêm opções", () => {
    renderChoices([]);

    expect(screen.getByText("Nenhuma cor.")).toBeVisible();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("tem um texto padrão para o grupo sem opções", () => {
    render(<CheckboxGroupField label="Cores" options={[]} />);

    expect(screen.getByText("Nenhuma opção.")).toBeVisible();
  });

  it("liga o erro ao grupo", () => {
    render(
      <CheckboxGroupField label="Cores" options={colors} error="Escolha no máximo 50 cores." />
    );

    expect(screen.getByRole("group", { name: "Cores" })).toHaveAccessibleDescription(
      "Escolha no máximo 50 cores."
    );
  });
});
