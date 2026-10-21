import { Button } from "@/shared/ui/button";
import { useSignOut } from "../model/hooks/use-sign-out";

export function SignOutButton() {
  const { onSignOut, isSigningOut } = useSignOut();

  return (
    <Button variant="ghost" size="sm" isLoading={isSigningOut} onClick={onSignOut}>
      Sair
    </Button>
  );
}
