import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type NoticeTone = "info" | "success" | "danger";

type NoticeProps = {
  tone?: NoticeTone;
  children: ReactNode;
};

const TONE_CLASSES: Record<NoticeTone, string> = {
  info: "border-line bg-surface-raised text-ink-muted",
  success: "border-transparent bg-success-soft text-success",
  danger: "border-transparent bg-danger-soft text-danger",
};

export function Notice({ tone = "info", children }: NoticeProps) {
  return (
    <p
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-md border px-3 py-2 text-sm", TONE_CLASSES[tone])}
    >
      {children}
    </p>
  );
}
