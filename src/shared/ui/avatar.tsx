import { cn } from "@/shared/lib/cn";

type AvatarProps = {
  name: string;
  className?: string;
};

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words;

  return letters
    .map(word => word[0])
    .join("")
    .toUpperCase();
}

export function Avatar({ name, className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-text",
        className
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
