import { createLink } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

export const TextLink = createLink(({ className, ...props }: ComponentProps<"a">) => (
  <a className={cn("font-medium text-accent-text hover:underline", className)} {...props} />
));
