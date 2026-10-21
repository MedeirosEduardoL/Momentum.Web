import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./pagination";

function renderPagination(page: number, totalPages: number) {
  const onPageChange = vi.fn();

  render(<Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />);

  return { onPageChange, user: userEvent.setup() };
}

describe("Pagination", () => {
  it("diz em que página a lista está e quantas existem", () => {
    renderPagination(2, 5);

    expect(screen.getByRole("navigation", { name: "Paginação" })).toHaveTextContent(
      "Página 2 de 5"
    );
  });

  it("pede a página seguinte e a anterior", async () => {
    const { onPageChange, user } = renderPagination(2, 5);

    await user.click(screen.getByRole("button", { name: "Próxima" }));
    await user.click(screen.getByRole("button", { name: "Anterior" }));

    expect(onPageChange.mock.calls).toEqual([[3], [1]]);
  });

  it("não deixa voltar da primeira página", () => {
    renderPagination(1, 5);

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeEnabled();
  });

  it("não deixa avançar da última página", () => {
    renderPagination(5, 5);

    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeEnabled();
  });
});
