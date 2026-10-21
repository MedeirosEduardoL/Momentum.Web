import type { RouteComponent } from "@tanstack/react-router";

type PreloadablePage = { preload?: () => Promise<void> | undefined };

export function withPagePreload(
  routeComponent: RouteComponent,
  page: PreloadablePage
): RouteComponent {
  return Object.assign(routeComponent, {
    preload: async () => {
      await page.preload?.();
    },
  });
}
