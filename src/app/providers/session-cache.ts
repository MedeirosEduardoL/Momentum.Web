import { hashKey, queryOptions, type Query, type QueryClient } from "@tanstack/react-query";
import { currentAccountQuery } from "@/features/account";
import { session } from "@/shared/api/client";
import type { SessionEndReason } from "@/shared/api/session";

export const sessionExpiryQuery = queryOptions({
  queryKey: ["session", "expired"] as const,
  queryFn: () => false,
  initialData: false,
  staleTime: Infinity,
});

const sessionStateHashes = new Set([
  hashKey(currentAccountQuery.queryKey),
  hashKey(sessionExpiryQuery.queryKey),
]);

function belongsToEndedSession(query: Query) {
  return !sessionStateHashes.has(query.queryHash);
}

function refreshForOpenedSession(queryClient: QueryClient) {
  queryClient.removeQueries({ type: "inactive" });

  return queryClient.invalidateQueries();
}

function forgetEndedSession(queryClient: QueryClient, reason: SessionEndReason) {
  const wasInUse = Boolean(queryClient.getQueryData(currentAccountQuery.queryKey));

  queryClient.setQueryData(sessionExpiryQuery.queryKey, reason === "expired" && wasInUse);
  queryClient.setQueryData(currentAccountQuery.queryKey, null);
  queryClient.removeQueries({ predicate: belongsToEndedSession });
}

export function bindSessionToCache(queryClient: QueryClient) {
  session.listen({
    onOpened: () => refreshForOpenedSession(queryClient),
    onEnded: reason => forgetEndedSession(queryClient, reason),
  });
}
