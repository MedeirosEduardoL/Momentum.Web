import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Project } from "@/features/project";

type FirstBoardState = {
  pendingProject: Project | null;
  markPending: (project: Project) => void;
  clearPending: () => void;
};

export const useFirstBoardStore = create<FirstBoardState>()(
  devtools(
    immer(set => ({
      pendingProject: null,
      markPending: project =>
        set(
          state => {
            state.pendingProject = project;
          },
          false,
          "firstBoard/markPending"
        ),
      clearPending: () =>
        set(
          state => {
            state.pendingProject = null;
          },
          false,
          "firstBoard/clearPending"
        ),
    })),
    { name: "first-board-store" }
  )
);
