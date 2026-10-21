import { SignInForm } from "@/features/account";
import { Notice } from "@/shared/ui/notice";
import { TextLink } from "@/shared/ui/text-link";
import { SIGN_IN_NOTICES, type SignInNotice } from "./notices";

type SignInPageProps = {
  notice?: SignInNotice;
};

export function SignInPage({ notice }: SignInPageProps) {
  return (
    <SignInForm
      notice={
        notice && (
          <Notice tone={SIGN_IN_NOTICES[notice].tone}>{SIGN_IN_NOTICES[notice].message}</Notice>
        )
      }
      footer={
        <>
          <TextLink to="/esqueci-a-senha">Esqueci a senha</TextLink>
          <span>
            Ainda não tem conta? <TextLink to="/cadastrar">Criar conta</TextLink>
          </span>
        </>
      }
    />
  );
}
