import { RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import { QueryProvider } from "@/app/providers/query-provider";
import { router } from "@/app/routes";
import { usePreferencesStore, type Theme } from "@/app/stores/preferences.store";
import { Toaster } from "@/shared/ui/toaster";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.themeChanging = "";
  root.dataset.theme = theme;
  getComputedStyle(root).getPropertyValue("color");
  delete root.dataset.themeChanging;
}

export function App() {
  const theme = usePreferencesStore(state => state.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <QueryProvider>
      <RouterProvider router={router} />
      <Toaster theme={theme} />
    </QueryProvider>
  );
}
