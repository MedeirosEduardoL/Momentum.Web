import { Button } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/text-field";
import { useCreateProject } from "../model/hooks/use-create-project";
import type { Project } from "../model/types/project.types";

type CreateProjectFormProps = {
  onCreated?: (project: Project) => void;
};

export function CreateProjectForm({ onCreated }: CreateProjectFormProps) {
  const { form, onSubmit, isSaving } = useCreateProject({ onCreated });
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <TextField
        label="Nome do projeto"
        autoComplete="off"
        error={errors.name?.message}
        {...form.register("name")}
      />
      <TextField
        label="Chave do projeto"
        autoComplete="off"
        maxLength={5}
        inputClassName="font-mono uppercase"
        hint="De 2 a 5 letras, sem acento. Ela prefixa os cards do projeto, como MOM em MOM-123."
        error={errors.key?.message}
        {...form.register("key")}
      />
      <Button type="submit" isLoading={isSaving}>
        Criar projeto
      </Button>
    </form>
  );
}
