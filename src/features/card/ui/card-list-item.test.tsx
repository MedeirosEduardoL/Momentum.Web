import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CardSummary } from "../model/types/card.types";
import { CardListItem } from "./card-list-item";

const card: CardSummary = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "issue",
  title: "Lista de chamados vazia",
  state: { id: "state-1", name: "Novo", category: "to_do", position: 1 },
  priority: "urgent",
  assignee: { userId: "user-1", name: "Ana Souza" },
  featureId: null,
  progress: 40,
  taskCount: 5,
  doneTaskCount: 2,
  subitemCounts: {
    task: { total: 0, done: 0 },
    bug: { total: 0, done: 0 },
    impediment: { total: 0, done: 0 },
  },
  isArchived: false,
  updatedAt: "2026-10-13T12:00:00Z",
};

function renderRow() {
  render(
    <table>
      <tbody>
        <CardListItem card={card} titleLink={<a href="/cards/card-1">{card.title}</a>} />
      </tbody>
    </table>
  );

  return screen.getByRole("row");
}

describe("CardListItem", () => {
  it("tem um link só, o do título, para o leitor de tela", () => {
    const row = renderRow();

    expect(within(row).getAllByRole("link")).toEqual([
      within(row).getByRole("link", { name: "Lista de chamados vazia" }),
    ]);
  });

  it("estica o link do título sobre a linha inteira, que serve de moldura a ele", () => {
    const row = renderRow();
    const titleLink = within(row).getByRole("link", { name: "Lista de chamados vazia" });

    expect(row).toHaveClass("relative");
    expect(titleLink.parentElement).toHaveClass("[&_a]:after:absolute", "[&_a]:after:inset-0");
  });

  it("mostra o identificador, o tipo, o estado, o responsável, a prioridade e o progresso", () => {
    const row = renderRow();

    expect(within(row).getByText("MOM-12")).toBeVisible();
    expect(within(row).getByText("Issue")).toBeVisible();
    expect(within(row).getByText("Novo")).toBeVisible();
    expect(within(row).getByText("Ana Souza")).toBeVisible();
    expect(within(row).getByText("Urgente")).toBeVisible();
    expect(within(row).getByText("40%")).toBeVisible();
  });
});
