import { fireEvent, render, screen } from "@testing-library/react";
import type { FormEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchField } from "./search-field";

const PAUSE_MS = 300;
const onSearch = vi.fn<(term: string) => void>();
const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());

function renderSearchField() {
  const view = render(
    <form onSubmit={onSubmit}>
      <SearchField label="Buscar card" hint="Pelo identificador." onSearch={onSearch} />
    </form>
  );

  return { ...view, input: screen.getByRole("searchbox", { name: "Buscar card" }) };
}

function typeInto(input: HTMLElement, ...values: string[]) {
  values.forEach(value => fireEvent.change(input, { target: { value } }));
}

beforeEach(() => {
  vi.useFakeTimers();
  onSearch.mockClear();
  onSubmit.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SearchField", () => {
  it("busca uma vez só, depois de uma pausa na digitação", () => {
    const { input } = renderSearchField();

    typeInto(input, "M", "MO", "MOM", "MOM-12");
    vi.advanceTimersByTime(PAUSE_MS - 1);

    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(onSearch.mock.calls).toEqual([["MOM-12"]]);
  });

  it("busca na hora com Enter, sem enviar o formulário em volta", () => {
    const { input } = renderSearchField();

    typeInto(input, "chamados");
    fireEvent.keyDown(input, { key: "Enter" });
    vi.advanceTimersByTime(PAUSE_MS);

    expect(onSearch.mock.calls).toEqual([["chamados"]]);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("busca o texto vazio quando o campo é limpo", () => {
    const { input } = renderSearchField();
    typeInto(input, "MOM");
    vi.advanceTimersByTime(PAUSE_MS);

    typeInto(input, "");
    vi.advanceTimersByTime(PAUSE_MS);

    expect(onSearch.mock.calls).toEqual([["MOM"], [""]]);
  });

  it("não busca depois que o campo sai da tela", () => {
    const { input, unmount } = renderSearchField();
    typeInto(input, "MOM");

    unmount();
    vi.advanceTimersByTime(PAUSE_MS);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("mostra a dica ligada ao campo", () => {
    const { input } = renderSearchField();

    expect(input).toHaveAccessibleDescription("Pelo identificador.");
  });
});
