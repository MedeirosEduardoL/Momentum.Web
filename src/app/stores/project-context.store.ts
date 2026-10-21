import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type ProjectContextState = {
  projectId: string | null;
  setProjectId: (projectId: string) => void;
};

export const useProjectContextStore = create<ProjectContextState>()(
  devtools(
    immer(set => ({
      projectId: null,
      setProjectId: projectId =>
        set(
          state => {
            state.projectId = projectId;
          },
          false,
          "projectContext/setProjectId"
        ),
    })),
    { name: "project-context-store" }
  )
);
