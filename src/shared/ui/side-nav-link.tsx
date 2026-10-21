import { createLink } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

export const SideNavLink = createLink(({ className, ...props }: ComponentProps<"a">) => (
  <a
    className={cn(
      "flex h-8 items-center gap-2.5 overflow-hidden rounded-md px-2 text-base font-medium whitespace-nowrap text-ink-muted transition-colors duration-150 ease-out hover:bg-surface-raised hover:text-ink aria-[current=page]:bg-surface-raised aria-[current=page]:text-ink [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-ink-subtle [&[aria-current=page]_svg]:text-accent-text",
      className
    )}
    {...props}
  />
));
