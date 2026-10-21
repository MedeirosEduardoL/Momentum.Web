import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";
import { TextField } from "@/shared/ui/text-field";
import { useSignUp } from "../model/hooks/use-sign-up";

type SignUpFormProps = {
  footer?: ReactNode;
};

export function SignUpForm({ footer }: SignUpFormProps) {
  const { form, onSubmit, isSaving, sentTo } = useSignUp();
  const { errors } = form.formState;

  if (sentTo) {
    return (
      <Panel
        title="Confira o seu e-mail"
        description={`Enviamos uma mensagem para ${sentTo}. Abra o link que está nela para confirmar o e-mail e escolher a sua senha. O link vale por 24 horas.`}
        footer={footer}
      />
    );
  }

  return (
    <Panel
      title="Criar conta"
      description="Você escolhe a senha ao confirmar o e-mail, e depois cria a sua organização e o primeiro projeto."
      footer={footer}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Nome"
          autoComplete="name"
          error={errors.name?.message}
          {...form.register("name")}
        />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="username"
          error={errors.email?.message}
          {...form.register("email")}
        />
        <Button type="submit" isLoading={isSaving}>
          Criar conta
        </Button>
      </form>
    </Panel>
  );
}
