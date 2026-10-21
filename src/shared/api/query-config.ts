import { QueryClient } from "@tanstack/react-query";
import { isTransientFailure } from "./api-error";

const DEFAULT_STALE_TIME_MS = 30_000;
const MAX_QUERY_RETRIES = 2;
const FINISHED_MUTATION_RETENTION_MS = 0;

export function shouldRetryQuery(failureCount: number, error: unknown) {
  return failureCount < MAX_QUERY_RETRIES && isTransientFailure(error);
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        retry: shouldRetryQuery,
      },
      mutations: {
        gcTime: FINISHED_MUTATION_RETENTION_MS,
      },
    },
  });
}
