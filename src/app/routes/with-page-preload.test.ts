import { describe, expect, it, vi } from "vitest";
import { withPagePreload } from "./with-page-preload";

function CardDetailRoute() {
  return null;
}

describe("withPagePreload", () => {
  it("devolve o componente da rota com o carregamento da página", async () => {
    const page = { preload: vi.fn().mockResolvedValue(undefined) };

    const routeComponent = withPagePreload(CardDetailRoute, page);
    await routeComponent.preload?.();

    expect(routeComponent).toBe(CardDetailRoute);
    expect(page.preload).toHaveBeenCalledTimes(1);
  });

  it("não tem o que carregar quando a página já chegou", async () => {
    const routeComponent = withPagePreload(CardDetailRoute, {});

    await expect(routeComponent.preload?.()).resolves.toBeUndefined();
  });
});
