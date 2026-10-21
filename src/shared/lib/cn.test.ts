import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("junta as classes e ignora as condições falsas", () => {
    const isActive = false;

    expect(cn("flex", isActive && "text-accent-text", undefined, "gap-2")).toBe("flex gap-2");
  });

  it("deixa a última classe vencer o conflito entre tokens", () => {
    expect(cn("bg-surface text-sm text-ink", "bg-surface-raised text-ink-muted")).toBe(
      "text-sm bg-surface-raised text-ink-muted"
    );
  });
});
