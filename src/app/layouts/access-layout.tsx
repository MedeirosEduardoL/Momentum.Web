import type { ReactNode } from "react";
import { Brand } from "@/shared/ui/brand";

export function AccessLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <Brand />
      <main className="flex w-full flex-col items-center">{children}</main>
    </div>
  );
}
