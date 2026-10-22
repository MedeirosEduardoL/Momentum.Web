import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { useCardExtensions, type CardExtensions } from "./card-extensions-context";
import { CardExtensionsProvider } from "./card-extensions-provider";

describe("useCardExtensions", () => {
  it("não oferece extensão nenhuma fora do provider", () => {
    const { result } = renderHook(() => useCardExtensions());

    expect(result.current.renderSubitemAttachments).toBeUndefined();
  });

  it("entrega o que a página ou o widget fornece", () => {
    const extensions: CardExtensions = { renderSubitemAttachments: () => "Anexos do subitem" };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CardExtensionsProvider value={extensions}>{children}</CardExtensionsProvider>
    );

    const { result } = renderHook(() => useCardExtensions(), { wrapper });

    expect(result.current).toBe(extensions);
  });
});
