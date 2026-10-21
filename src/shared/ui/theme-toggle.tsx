import { Moon, Sun } from "lucide-react";

type ThemeToggleProps = {
  theme: "light" | "dark";
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Usar o tema claro" : "Usar o tema escuro"}
      onClick={onToggle}
      className="inline-flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 ease-out hover:bg-surface-raised hover:text-ink"
    >
      {isDark ? <Sun aria-hidden className="size-4" /> : <Moon aria-hidden className="size-4" />}
    </button>
  );
}
