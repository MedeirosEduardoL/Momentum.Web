import { Building2, FolderKanban, Layers, ListChecks, Settings, SquareKanban } from "lucide-react";
import { ProjectIdentity } from "@/features/project";
import { cn } from "@/shared/lib/cn";
import { SideNavLink } from "@/shared/ui/side-nav-link";

type SideNavProps = {
  projectId?: string;
  isCollapsed: boolean;
};

export function SideNav({ projectId, isCollapsed }: SideNavProps) {
  return (
    <aside
      aria-label="Navegação"
      className={cn(
        "glass sticky top-12 flex h-[calc(100dvh-3rem)] shrink-0 flex-col gap-5 overflow-x-hidden border-r border-glass-line px-2 py-3 transition-[width] duration-200 ease-out",
        isCollapsed ? "w-12" : "w-12 lg:w-60"
      )}
    >
      <nav aria-label="Projetos" className="flex flex-col gap-0.5">
        <SideNavLink to="/" activeOptions={{ exact: true }} title="Projetos">
          <FolderKanban aria-hidden />
          <span>Projetos</span>
        </SideNavLink>
      </nav>
      {projectId && (
        <nav aria-label="Projeto" className="flex flex-col gap-0.5">
          <div className="mb-1 flex h-8 items-center">
            <ProjectIdentity projectId={projectId} keySlotClassName="w-8" />
          </div>
          <SideNavLink to="/projetos/$projectId/boards" params={{ projectId }} title="Boards">
            <SquareKanban aria-hidden />
            <span>Boards</span>
          </SideNavLink>
          <SideNavLink to="/projetos/$projectId/cards" params={{ projectId }} title="Cards">
            <ListChecks aria-hidden />
            <span>Cards</span>
          </SideNavLink>
          <SideNavLink
            to="/projetos/$projectId/features"
            params={{ projectId }}
            title="Features e epics"
          >
            <Layers aria-hidden />
            <span>Features e epics</span>
          </SideNavLink>
        </nav>
      )}
      <nav aria-label="Configurações" className="mt-auto flex flex-col gap-0.5">
        {projectId && (
          <SideNavLink
            to="/organizacao/projetos/$projectId/time"
            params={{ projectId }}
            title="Configurações do projeto"
          >
            <Settings aria-hidden />
            <span>Configurações do projeto</span>
          </SideNavLink>
        )}
        <SideNavLink to="/organizacao" title="Organização">
          <Building2 aria-hidden />
          <span>Organização</span>
        </SideNavLink>
      </nav>
    </aside>
  );
}
