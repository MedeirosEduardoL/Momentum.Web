import type { Account } from "@/features/account";

export function otherSignedInAccount(account: Account | null | undefined, invitedEmail: string) {
  return account && account.email !== invitedEmail ? account : null;
}
