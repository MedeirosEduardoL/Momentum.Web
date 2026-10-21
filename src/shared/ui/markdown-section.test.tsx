import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownSection } from "./markdown-section";

describe("MarkdownSection", () => {
  it("mostra o texto como markdown, sob o título da seção", () => {
    render(<MarkdownSection title="Descrição" content="Texto **forte**" emptyText="Sem texto." />);

    expect(screen.getByRole("heading", { name: "Descrição" })).toBeVisible();
    expect(screen.getByText("forte").tagName).toBe("STRONG");
    expect(screen.queryByText("Sem texto.")).not.toBeInTheDocument();
  });

  it("não deixa o texto de terceiros virar script nem carregar recurso de fora", () => {
    const { container } = render(
      <MarkdownSection
        title="Descrição"
        content={'<script>window.injected = true</script><img src="x" onerror="alert(1)">'}
        emptyText="Sem texto."
      />
    );

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
    expect(container.querySelector("[src]")).toBeNull();
  });

  it("mostra o texto de vazio quando não há conteúdo", () => {
    render(<MarkdownSection title="Descrição" content="" emptyText="Sem descrição." />);

    expect(screen.getByText("Sem descrição.")).toBeVisible();
  });
});
