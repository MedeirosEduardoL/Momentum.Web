import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { accountKeys } from "./account-api-keys";
import { getCurrentAccount, previewEmailVerification } from "./account.service";

export const currentAccountQuery = queryOptions({
  queryKey: accountKeys.current(),
  queryFn: getCurrentAccount,
});

export function useGetCurrentAccount() {
  return useQuery(currentAccountQuery);
}

export function useGetEmailVerificationPreview(token: string | null) {
  return useQuery({
    queryKey: accountKeys.emailVerificationPreview(token),
    queryFn: token === null ? skipToken : () => previewEmailVerification(token),
    staleTime: Infinity,
    gcTime: 0,
  });
}
