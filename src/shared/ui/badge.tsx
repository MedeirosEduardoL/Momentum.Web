import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type BadgeTone = "neutral" | "accent" | "info" | "success" | "warning" | "danger";

type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
};

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-raised text-ink-muted",
  accent: "bg-accent-soft text-accent-text",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        TONE_CLASSES[tone]
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
