import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

type CheckboxFieldProps = Omit<ComponentProps<"input">, "type"> & {
  label: string;
};

export function CheckboxField({ label, className, ...inputProps }: CheckboxFieldProps) {
  return (
    <label className={cn("flex items-center gap-2", className)}>
      <input
        type="checkbox"
        className="size-4 shrink-0 accent-accent disabled:opacity-50"
        {...inputProps}
      />
      <span className="min-w-0 break-words">{label}</span>
    </label>
  );
}
