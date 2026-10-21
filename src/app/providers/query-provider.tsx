import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createQueryClient } from "@/shared/api/query-config";
import { bindSessionToCache } from "./session-cache";

const queryClient = createQueryClient();

bindSessionToCache(queryClient);

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
