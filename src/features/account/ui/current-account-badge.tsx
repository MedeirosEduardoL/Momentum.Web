import { Avatar } from "@/shared/ui/avatar";
import { useGetCurrentAccount } from "../api/account.queries";

export function CurrentAccountBadge() {
  const account = useGetCurrentAccount();

  if (!account.data) {
    return null;
  }

  return (
    <span className="flex items-center gap-2">
      <Avatar name={account.data.name} />
      <span className="hidden text-sm font-medium text-ink sm:inline">{account.data.name}</span>
    </span>
  );
}
