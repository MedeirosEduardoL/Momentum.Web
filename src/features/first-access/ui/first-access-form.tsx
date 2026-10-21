import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";
import { TextField } from "@/shared/ui/text-field";
import { useFirstAccess } from "../model/hooks/use-first-access";

type FirstAccessFormProps = {
  projectStep: ReactNode;
  footer?: ReactNode;
};

export function FirstAccessForm({ projectStep, footer }: FirstAccessFormProps) {
  const { form, onSubmit, isSaving, hasOrganization } = useFirstAccess();
  const { errors } = form.formState;

  if (hasOrganization) {
    return (
      <Panel
        title="Crie o primeiro projeto"
        description="A sua organização já existe. Falta o primeiro projeto para o time começar."
        footer={footer}
      >
        {projectStep}
      </Panel>
    );
  }

  return (
    <Panel
      title="Crie a sua organização"
      description="A organização reúne as pessoas e os projetos da sua empresa. Você será o administrador da organização e, em seguida, cria o primeiro projeto."
      footer={footer}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Nome da organização"
          autoComplete="organization"
          error={errors.organizationName?.message}
          {...form.register("organizationName")}
        />
        <Button type="submit" isLoading={isSaving}>
          Criar organização
        </Button>
      </form>
    </Panel>
  );
}
