import { describe, expect, it } from "vitest";
import { router } from "./index";

const REDIRECT_ROUTE_IDS = new Set([
  "/member/organizacao/",
  "/member/projetos/$projectId/cards",
  "/member/projetos/$projectId/features",
]);

function isPageRoute(route: { id: string; children?: unknown }) {
  return !route.children && !REDIRECT_ROUTE_IDS.has(route.id);
}

describe("router", () => {
  it("carrega o chunk da página antes de mostrar a rota, em toda rota de página", () => {
    const pageRoutes = Object.values(router.routesById).filter(route => isPageRoute(route));

    const withoutPreload = pageRoutes
      .filter(route => typeof route.options.component?.preload !== "function")
      .map(route => route.id);

    expect(pageRoutes.length).toBeGreaterThan(0);
    expect(withoutPreload).toEqual([]);
  });

  it("cria e edita feature e epic em telas próprias, como o card", () => {
    expect(Object.keys(router.routesById)).toEqual(
      expect.arrayContaining([
        "/member/projetos/$projectId/epics/novo",
        "/member/projetos/$projectId/features/nova",
        "/member/epics/$epicId/features/nova",
        "/member/features/$featureId/editar",
        "/member/epics/$epicId/editar",
      ])
    );
  });
});
