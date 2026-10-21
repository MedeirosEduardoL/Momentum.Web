import { cn } from "@/shared/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export type ButtonStyle = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary: "glass-control border border-line-strong text-ink hover:bg-surface-raised",
  ghost: "text-ink-muted hover:bg-surface-raised hover:text-ink",
  danger: "bg-danger text-canvas hover:bg-danger/90",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-9 px-3.5 text-base",
};

export function buttonClassName({ variant = "primary", size = "md", className }: ButtonStyle) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className
  );
}
