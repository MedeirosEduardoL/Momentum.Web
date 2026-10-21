import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { buttonClassName, type ButtonStyle } from "@/shared/ui/button-styles";

type ButtonProps = ComponentProps<"button"> &
  ButtonStyle & {
    isLoading?: boolean;
  };

export function Button({
  variant,
  size,
  isLoading = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={buttonClassName({ variant, size, className })}
      {...props}
    >
      {isLoading && <LoaderCircle aria-hidden className="animate-spin" />}
      {children}
    </button>
  );
}
