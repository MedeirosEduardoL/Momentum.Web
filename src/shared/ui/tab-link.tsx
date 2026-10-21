import { createLink } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

export const TabLink = createLink(({ className, ...props }: ComponentProps<"a">) => (
  <a
    className={cn(
      "-mb-px inline-flex h-9 items-center border-b-2 border-transparent text-base font-medium text-ink-muted transition-colors duration-150 ease-out hover:text-ink aria-[current=page]:border-accent aria-[current=page]:font-semibold aria-[current=page]:text-accent-text",
      className
    )}
    {...props}
  />
));
