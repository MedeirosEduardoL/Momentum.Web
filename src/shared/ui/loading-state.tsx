import { LoaderCircle } from "lucide-react";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Carregando…" }: LoadingStateProps) {
  return (
    <div role="status" className="flex flex-1 items-center justify-center gap-2 p-8 text-ink-muted">
      <LoaderCircle aria-hidden className="size-4 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
