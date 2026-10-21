import { createLink } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { buttonClassName, type ButtonStyle } from "@/shared/ui/button-styles";

export const ButtonLink = createLink(
  ({ variant, size, className, ...props }: ComponentProps<"a"> & ButtonStyle) => (
    <a className={buttonClassName({ variant, size, className })} {...props} />
  )
);
