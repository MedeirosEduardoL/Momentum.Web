import { Moon } from "lucide-react";

export function Brand() {
  return (
    <span className="inline-flex items-center gap-2">
      <Moon aria-hidden className="size-4 text-accent-text" />
      <span className="text-sm font-semibold">Momentum</span>
    </span>
  );
}
