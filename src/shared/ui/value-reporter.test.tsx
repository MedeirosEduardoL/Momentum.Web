import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ValueReporter } from "./value-reporter";

describe("ValueReporter", () => {
  it("avisa o valor ao aparecer e a cada mudança, sem desenhar nada", () => {
    const onReport = vi.fn();
    const { container, rerender } = render(<ValueReporter value="project-1" onReport={onReport} />);

    rerender(<ValueReporter value="project-1" onReport={onReport} />);
    rerender(<ValueReporter value="project-2" onReport={onReport} />);

    expect(onReport.mock.calls).toEqual([["project-1"], ["project-2"]]);
    expect(container).toBeEmptyDOMElement();
  });
});
