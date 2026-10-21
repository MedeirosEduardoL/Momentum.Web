import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { Notice } from "@/shared/ui/notice";
import { Panel } from "@/shared/ui/panel";
import { TextField } from "@/shared/ui/text-field";
import { useSignIn } from "../model/hooks/use-sign-in";

type SignInFormProps = {
  notice?: ReactNode;
  footer?: ReactNode;
};

export function SignInForm({ notice, footer }: SignInFormProps) {
  const { form, onSubmit, isSaving, refusal } = useSignIn();
  const { errors } = form.formState;

  return (
    <Panel title="Entrar" description="Acesse o Momentum com a sua conta." footer={footer}>
      {notice}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="E-mail"
          type="email"
          autoComplete="username"
          error={errors.email?.message}
          {...form.register("email")}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...form.register("password")}
        />
        {refusal && <Notice tone="danger">{refusal}</Notice>}
        <Button type="submit" isLoading={isSaving}>
          Entrar
        </Button>
      </form>
    </Panel>
  );
}
