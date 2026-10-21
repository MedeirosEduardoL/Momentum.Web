import { ORGANIZATION_ROLE_OPTIONS } from "@/features/organization";
import { PROJECT_ROLE_OPTIONS, type Project } from "@/features/project";
import { Button } from "@/shared/ui/button";
import { SelectField, type SelectOption } from "@/shared/ui/select-field";
import { TextField } from "@/shared/ui/text-field";
import { useInviteMember } from "../model/hooks/use-invite-member";
import { NOT_IN_TEAM } from "../model/schemas/invitation.schema";

type InvitationFormProps = {
  projects: Project[];
  onInvited: () => void;
};

const TEAM_OPTIONS: SelectOption[] = [
  { value: NOT_IN_TEAM, label: "Fora do time" },
  ...PROJECT_ROLE_OPTIONS,
];

export function InvitationForm({ projects, onInvited }: InvitationFormProps) {
  const { form, onSubmit, isSaving, projectsError } = useInviteMember({ projects, onInvited });
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <TextField
        label="E-mail"
        type="email"
        autoComplete="off"
        error={errors.email?.message}
        {...form.register("email")}
      />
      <SelectField
        label="Papel na organização"
        options={ORGANIZATION_ROLE_OPTIONS}
        error={errors.role?.message}
        {...form.register("role")}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-ink-muted">Papel em cada projeto</legend>
        {projects.map(project => (
          <div key={project.id} className="flex items-center gap-3">
            <span className="w-14 font-mono text-sm text-ink-subtle">{project.key}</span>
            <span className="min-w-0 flex-1 truncate">{project.name}</span>
            <SelectField
              isLabelHidden
              label={`Papel no projeto ${project.name}`}
              options={TEAM_OPTIONS}
              {...form.register(`projectRoles.${project.id}`)}
            />
          </div>
        ))}
        {projectsError && (
          <p role="alert" className="text-sm text-danger">
            {projectsError}
          </p>
        )}
      </fieldset>
      <Button type="submit" isLoading={isSaving}>
        Enviar convite
      </Button>
    </form>
  );
}
