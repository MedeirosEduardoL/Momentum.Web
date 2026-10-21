import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./avatar";

function initialsShownFor(name: string) {
  const { container } = render(<Avatar name={name} />);

  return container.textContent;
}

describe("Avatar", () => {
  it("mostra a inicial do primeiro e do último nome", () => {
    expect(initialsShownFor("Bruna Lima Sintética")).toBe("BS");
  });

  it("mostra uma inicial só para quem tem um nome", () => {
    expect(initialsShownFor("bruna")).toBe("B");
  });

  it("ignora os espaços sobrando", () => {
    expect(initialsShownFor("  ana   maria  ")).toBe("AM");
  });

  it("fica fora da leitura de tela, porque o nome aparece ao lado", () => {
    const { container } = render(<Avatar name="Bruna Sintética" />);

    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
