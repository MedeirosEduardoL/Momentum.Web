import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type ScreenProps = {
  title: string;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  backLink?: ReactNode;
  action?: ReactNode;
  isWide?: boolean;
  children: ReactNode;
};

export function Screen({
  title,
  eyebrow,
  meta,
  backLink,
  action,
  isWide = false,
  children,
}: ScreenProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8",
        !isWide && "max-w-4xl"
      )}
    >
      {backLink && <div className="text-sm">{backLink}</div>}
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow}
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-balance">{title}</h1>
          {meta && <div className="mt-1">{meta}</div>}
        </div>
        {action && (
          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">{action}</div>
        )}
      </header>
      {children}
    </div>
  );
}
