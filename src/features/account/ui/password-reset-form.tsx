import type { ReactNode } from "react";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { Button } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";
import { TextField } from "@/shared/ui/text-field";
import { useResetPasswordMutation } from "../api/account.mutations";
import { useLinkPassword } from "../model/hooks/use-link-password";
import { linkPasswordSchema } from "../model/schemas/link-password.schema";

type PasswordResetFormProps = {
  token: string | null;
  onReset: () => void;
  newLinkAction: ReactNode;
  footer?: ReactNode;
};

const resolver = zodResolver(linkPasswordSchema);

export function PasswordResetForm({
  token,
  onReset,
  newLinkAction,
  footer,
}: PasswordResetFormProps) {
  const submission = useResetPasswordMutation();
  const { form, onSubmit, isSaving, isLinkInvalid } = useLinkPassword({
    token,
    resolver,
    submission,
    onDone: onReset,
  });

  if (isLinkInvalid) {
    return (
      <Panel
        title="Link inválido ou expirado"
        description="O link para escolher uma senha nova vale por 1 hora e só pode ser usado uma vez."
        footer={footer}
      >
        <p>{newLinkAction}</p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Escolher uma senha nova"
      description="Ao salvar, as sessões abertas com a senha antiga são encerradas."
      footer={footer}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Senha nova"
          type="password"
          autoComplete="new-password"
          hint="De 10 a 128 caracteres."
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <Button type="submit" isLoading={isSaving}>
          Salvar senha
        </Button>
      </form>
    </Panel>
  );
}
