import { useParams } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { usePreferencesStore } from "@/app/stores/preferences.store";
import { useProjectContextStore } from "@/app/stores/project-context.store";
import { SideNav } from "./side-nav";
import { TopBar } from "./top-bar";

function useCurrentProjectId() {
  const { projectId, cardId, featureId, epicId } = useParams({ strict: false });
  const rememberedProjectId = useProjectContextStore(state => state.projectId);
  const setProjectId = useProjectContextStore(state => state.setProjectId);
  const isItemRoute = Boolean(cardId ?? featureId ?? epicId);

  useEffect(() => {
    if (projectId) {
      setProjectId(projectId);
    }
  }, [projectId, setProjectId]);

  return projectId ?? (isItemRoute ? (rememberedProjectId ?? undefined) : undefined);
}

export function AppLayout({ children }: { children: ReactNode }) {
  const projectId = useCurrentProjectId();
  const theme = usePreferencesStore(state => state.theme);
  const isNavCollapsed = usePreferencesStore(state => state.isNavCollapsed);
  const toggleTheme = usePreferencesStore(state => state.toggleTheme);
  const toggleNav = usePreferencesStore(state => state.toggleNav);

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar
        projectId={projectId}
        theme={theme}
        isNavCollapsed={isNavCollapsed}
        onToggleTheme={toggleTheme}
        onToggleNav={toggleNav}
      />
      <div className="flex flex-1">
        <SideNav projectId={projectId} isCollapsed={isNavCollapsed} />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
