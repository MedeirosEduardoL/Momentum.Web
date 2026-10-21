import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  it("oferece o tema escuro a quem está no claro", async () => {
    const onToggle = vi.fn();
    render(<ThemeToggle theme="light" onToggle={onToggle} />);

    await userEvent.click(screen.getByRole("button", { name: "Usar o tema escuro" }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("oferece o tema claro a quem está no escuro", () => {
    render(<ThemeToggle theme="dark" onToggle={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Usar o tema claro" })).toBeVisible();
  });
});
