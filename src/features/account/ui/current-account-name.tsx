import { useGetCurrentAccount } from "../api/account.queries";

export function CurrentAccountName() {
  const account = useGetCurrentAccount();

  if (!account.data) {
    return null;
  }

  return <span className="text-sm text-ink-muted">{account.data.name}</span>;
}
