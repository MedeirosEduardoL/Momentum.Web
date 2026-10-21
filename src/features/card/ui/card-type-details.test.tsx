import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CardTypeFields } from "../model/types/card.types";
import { CardTypeDetails } from "./card-type-details";

const HOSTILE =
  '**forte** <img src="x" onerror="alert(1)">\n\n<script>window.injected = true</script>';

const hostileFieldsByType: CardTypeFields[] = [
  { type: "user_story", acceptanceCriteria: [HOSTILE, HOSTILE] },
  { type: "spike", question: HOSTILE, deadline: null, conclusion: HOSTILE },
  {
    type: "issue",
    stepsToReproduce: HOSTILE,
    expectedBehavior: HOSTILE,
    observedBehavior: HOSTILE,
    severity: null,
    location: "Lista de cards",
  },
  { type: "tech_debt", impact: HOSTILE },
];

function headings() {
  return screen.getAllByRole("heading").map(heading => heading.textContent);
}

describe("CardTypeDetails", () => {
  it.each(hostileFieldsByType)(
    "mostra os campos de texto de $type como markdown sanitizado",
    fields => {
      const { container } = render(<CardTypeDetails fields={fields} />);

      expect(container.querySelector("script")).toBeNull();
      expect(container.querySelector("[onerror]")).toBeNull();
      expect(container.querySelector("[src]")).toBeNull();
      expect(container.textContent).not.toContain("window.injected");
      screen.getAllByText("forte").forEach(text => expect(text.tagName).toBe("STRONG"));
    }
  );

  it("lista os critérios de aceite da user story, na ordem", () => {
    render(
      <CardTypeDetails
        fields={{ type: "user_story", acceptanceCriteria: ["Filtra por tipo", "Guarda na URL"] }}
      />
    );

    expect(headings()).toEqual(["Critérios de aceite"]);
    expect(screen.getAllByRole("listitem").map(item => item.textContent.trim())).toEqual([
      "Filtra por tipo",
      "Guarda na URL",
    ]);
  });

  it("diz que a user story ainda não tem critério de aceite", () => {
    render(<CardTypeDetails fields={{ type: "user_story", acceptanceCriteria: [] }} />);

    expect(screen.getByText("Nenhum critério de aceite.")).toBeVisible();
  });

  it("mostra a pergunta, o prazo e a conclusão do spike, com o prazo no dia certo", () => {
    render(
      <CardTypeDetails
        fields={{
          type: "spike",
          question: "Vale usar SSE?",
          deadline: "2026-10-20",
          conclusion: "",
        }}
      />
    );

    expect(headings()).toEqual(["Pergunta", "Prazo", "Conclusão"]);
    expect(screen.getByText("Vale usar SSE?")).toBeVisible();
    expect(screen.getByText("20/10/2026")).toBeVisible();
    expect(screen.getByText("Não informado.")).toBeVisible();
  });

  it("diz que o spike está sem prazo", () => {
    render(
      <CardTypeDetails fields={{ type: "spike", question: "", deadline: null, conclusion: "" }} />
    );

    expect(screen.getByText("Sem prazo.")).toBeVisible();
  });

  it("mostra o local da issue como texto puro, em fonte monoespaçada", () => {
    const { container } = render(
      <CardTypeDetails
        fields={{
          type: "issue",
          stepsToReproduce: "",
          expectedBehavior: "",
          observedBehavior: "",
          severity: null,
          location: "src/__init__.py <script>window.injected = true</script>",
        }}
      />
    );

    const location = screen.getByText("src/__init__.py <script>window.injected = true</script>");
    expect(location).toHaveClass("font-mono");
    expect(container.querySelector("strong")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });

  it("mostra os cinco campos da issue, com o rótulo da severidade", () => {
    render(
      <CardTypeDetails
        fields={{
          type: "issue",
          stepsToReproduce: "Abrir a lista",
          expectedBehavior: "Mostrar os cards",
          observedBehavior: "Lista vazia",
          severity: "critical",
          location: "Lista de cards",
        }}
      />
    );

    expect(headings()).toEqual([
      "Passos para reproduzir",
      "Comportamento esperado",
      "Comportamento observado",
      "Severidade",
      "Local",
    ]);
    expect(screen.getByText("Crítica")).toBeVisible();
    expect(screen.getByText("Lista de cards")).toBeVisible();
  });

  it("mostra o impacto da dívida técnica", () => {
    render(<CardTypeDetails fields={{ type: "tech_debt", impact: "Build lento" }} />);

    expect(headings()).toEqual(["Impacto"]);
    expect(screen.getByText("Build lento")).toBeVisible();
  });
});
