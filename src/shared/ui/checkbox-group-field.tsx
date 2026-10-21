import { useId, type ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { CheckboxField } from "@/shared/ui/checkbox-field";
import type { SelectOption } from "@/shared/ui/select-field";

type CheckboxGroupFieldProps = Omit<ComponentProps<"input">, "type" | "value"> & {
  label: string;
  options: SelectOption[];
  emptyText?: string;
  error?: string;
};

export function CheckboxGroupField({
  label,
  options,
  emptyText = "Nenhuma opção.",
  error,
  className,
  ...inputProps
}: CheckboxGroupFieldProps) {
  const errorId = useId();

  return (
    <fieldset
      aria-describedby={error ? errorId : undefined}
      className={cn("flex min-w-0 flex-col gap-1.5", className)}
    >
      <legend className="mb-1.5 text-sm font-medium text-ink-muted">{label}</legend>
      {options.length === 0 ? (
        <p className="text-sm text-ink-subtle">{emptyText}</p>
      ) : (
        <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-line-strong glass-control p-2">
          {options.map(option => (
            <CheckboxField
              key={option.value}
              label={option.label}
              value={option.value}
              {...inputProps}
            />
          ))}
        </div>
      )}
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
