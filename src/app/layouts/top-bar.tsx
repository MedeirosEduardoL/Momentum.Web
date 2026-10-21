import { Link } from "@tanstack/react-router";
import { ChevronRight, PanelLeft } from "lucide-react";
import { CurrentAccountBadge, SignOutButton } from "@/features/account";
import { CurrentOrganizationName } from "@/features/organization";
import { ProjectIdentity } from "@/features/project";
import { cn } from "@/shared/lib/cn";
import { Brand } from "@/shared/ui/brand";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

type TopBarProps = {
  projectId?: string;
  theme: "light" | "dark";
  isNavCollapsed: boolean;
  onToggleTheme: () => void;
  onToggleNav: () => void;
};

const CRUMB_CLASS = "flex min-w-0 items-center rounded-md px-1.5 py-1 hover:bg-surface-raised";

export function TopBar({
  projectId,
  theme,
  isNavCollapsed,
  onToggleTheme,
  onToggleNav,
}: TopBarProps) {
  return (
    <header className="glass sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-glass-line px-2">
      <button
        type="button"
        aria-label={isNavCollapsed ? "Expandir a navegação" : "Recolher a navegação"}
        aria-expanded={!isNavCollapsed}
        onClick={onToggleNav}
        className="hidden size-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 ease-out hover:bg-surface-raised hover:text-ink lg:inline-flex"
      >
        <PanelLeft aria-hidden className="size-4" />
      </button>
      <Link to="/" className="shrink-0 rounded-md px-1.5 py-1 hover:bg-surface-raised">
        <Brand />
      </Link>
      <nav aria-label="Caminho" className="flex min-w-0 items-center gap-0.5 text-sm">
        <span className={cn("flex min-w-0 items-center gap-0.5", projectId && "max-sm:hidden")}>
          <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-subtle" />
          <Link to="/organizacao" className={CRUMB_CLASS}>
            <CurrentOrganizationName />
          </Link>
        </span>
        {projectId && (
          <>
            <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-subtle" />
            <Link to="/projetos/$projectId/boards" params={{ projectId }} className={CRUMB_CLASS}>
              <ProjectIdentity projectId={projectId} />
            </Link>
          </>
        )}
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <span aria-hidden className="h-6 w-px bg-line" />
        <CurrentAccountBadge />
        <span aria-hidden className="h-6 w-px bg-line" />
        <SignOutButton />
      </div>
    </header>
  );
}
