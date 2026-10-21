import { useGetCurrentAccount } from "../api/account.queries";

type AccountIdentityProps = {
  userId: string;
  name: string;
  email: string;
};

export function AccountIdentity({ userId, name, email }: AccountIdentityProps) {
  const account = useGetCurrentAccount();

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="truncate font-medium">
        {name}
        {userId === account.data?.id && (
          <span className="font-normal text-ink-subtle"> (você)</span>
        )}
      </span>
      <span className="truncate text-sm text-ink-muted">{email}</span>
    </div>
  );
}
