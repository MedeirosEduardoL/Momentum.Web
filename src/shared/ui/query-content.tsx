import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getApiErrorMessage } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { LoadingState } from "@/shared/ui/loading-state";

type QueryContentProps<TData> = {
  query: UseQueryResult<TData>;
  loadingLabel: string;
  errorTitle: string;
  children: (data: TData) => ReactNode;
};

export function QueryContent<TData>({
  query,
  loadingLabel,
  errorTitle,
  children,
}: QueryContentProps<TData>) {
  if (query.data !== undefined) {
    return children(query.data);
  }

  if (query.isPending) {
    return <LoadingState label={loadingLabel} />;
  }

  return (
    <EmptyState
      title={errorTitle}
      description={getApiErrorMessage(query.error)}
      action={
        <Button variant="secondary" onClick={() => query.refetch()}>
          Tentar de novo
        </Button>
      }
    />
  );
}
