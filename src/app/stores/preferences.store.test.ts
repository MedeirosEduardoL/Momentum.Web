import { beforeEach, describe, expect, it } from "vitest";
import { PREFERENCES_STORAGE_KEY, usePreferencesStore } from "./preferences.store";

function storedPreferences() {
  return JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? "{}").state;
}

beforeEach(() => {
  usePreferencesStore.setState({ theme: "light", isNavCollapsed: false });
});

describe("usePreferencesStore", () => {
  it("troca o tema entre o claro e o escuro", () => {
    usePreferencesStore.getState().toggleTheme();

    expect(usePreferencesStore.getState().theme).toBe("dark");

    usePreferencesStore.getState().toggleTheme();

    expect(usePreferencesStore.getState().theme).toBe("light");
  });

  it("recolhe e expande a navegação lateral", () => {
    usePreferencesStore.getState().toggleNav();

    expect(usePreferencesStore.getState().isNavCollapsed).toBe(true);
  });

  it("guarda as preferências no navegador, para valerem depois de recarregar", () => {
    usePreferencesStore.getState().toggleTheme();
    usePreferencesStore.getState().toggleNav();

    expect(storedPreferences()).toEqual({ theme: "dark", isNavCollapsed: true });
  });
});
