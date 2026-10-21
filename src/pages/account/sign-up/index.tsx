import { SignUpForm } from "@/features/account";
import { TextLink } from "@/shared/ui/text-link";

export function SignUpPage() {
  return (
    <SignUpForm
      footer={
        <span>
          Já tem conta? <TextLink to="/entrar">Entrar</TextLink>
        </span>
      }
    />
  );
}
