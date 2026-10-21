import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { createQueryWrapper } from "@/test/query-wrapper";
import type { CardListFilters, CardOptions } from "../model/types/card.types";
import { CardListFilterBar } from "./card-list-filter-bar";

vi.mock("@/shared/api/client", () => ({ api: { get: vi.fn() } }));

const options: CardOptions = {
  states: [{ id: "state-1", name: "Novo", category: "to_do", position: 1 }],
  team: [{ userId: "user-1", name: "Ana Souza", email: "ana@exemplo.test", role: "member" }],
};

function renderFilterBar(filters: CardListFilters) {
  const onFiltersChange = vi.fn<(filters: CardListFilters) => void>();
  render(
    <CardListFilterBar
      projectId="project-1"
      options={options}
      filters={filters}
      onFiltersChange={onFiltersChange}
    />,
    { wrapper: createQueryWrapper().wrapper }
  );

  return { user: userEvent.setup(), onFiltersChange };
}

beforeEach(() => {
  vi.mocked(api.get)
    .mockReset()
    .mockResolvedValue({ data: { items: [], page: 1, page_size: 100, total: 0 } });
});

describe("CardListFilterBar", () => {
  it("filtra pelos cards sem responsável, voltando à primeira página", async () => {
    const { user, onFiltersChange } = renderFilterBar({
      assigneeId: "user-1",
      includesArchived: false,
      page: 3,
    });

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Responsável" }),
      "Sem responsável"
    );

    expect(onFiltersChange).toHaveBeenCalledWith({
      assigneeId: undefined,
      isUnassigned: true,
      includesArchived: false,
      page: 1,
    });
  });

  it("troca o sem responsável por uma pessoa do time", async () => {
    const { user, onFiltersChange } = renderFilterBar({
      isUnassigned: true,
      includesArchived: false,
      page: 1,
    });

    expect(screen.getByRole("combobox", { name: "Responsável" })).toHaveDisplayValue(
      "Sem responsável"
    );
    await user.selectOptions(screen.getByRole("combobox", { name: "Responsável" }), "Ana Souza");

    expect(onFiltersChange).toHaveBeenCalledWith({
      assigneeId: "user-1",
      isUnassigned: undefined,
      includesArchived: false,
      page: 1,
    });
  });
});
