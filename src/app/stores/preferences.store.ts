import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type Theme = "light" | "dark";

type PreferencesState = {
  theme: Theme;
  isNavCollapsed: boolean;
  toggleTheme: () => void;
  toggleNav: () => void;
};

export const PREFERENCES_STORAGE_KEY = "momentum-preferences";

export const usePreferencesStore = create<PreferencesState>()(
  devtools(
    persist(
      immer(set => ({
        theme: "light",
        isNavCollapsed: false,
        toggleTheme: () =>
          set(
            state => {
              state.theme = state.theme === "light" ? "dark" : "light";
            },
            false,
            "preferences/toggleTheme"
          ),
        toggleNav: () =>
          set(
            state => {
              state.isNavCollapsed = !state.isNavCollapsed;
            },
            false,
            "preferences/toggleNav"
          ),
      })),
      { name: PREFERENCES_STORAGE_KEY }
    ),
    { name: "preferences-store" }
  )
);
