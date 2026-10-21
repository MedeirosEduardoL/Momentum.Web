import type { OrganizationMember } from "@/features/organization";
import { Button } from "@/shared/ui/button";
import { Notice } from "@/shared/ui/notice";
import { QueryContent } from "@/shared/ui/query-content";
import { SelectField, type SelectOption } from "@/shared/ui/select-field";
import { useAddProjectMember } from "../model/hooks/use-add-project-member";
import { PROJECT_ROLE_OPTIONS } from "../model/lib/project-role";
import { listTeamCandidates } from "../model/lib/team-candidates";
import { NO_PERSON } from "../model/schemas/project-member.schema";
import type { ProjectMember } from "../model/types/project.types";

type ProjectMemberFormProps = {
  projectId: string;
  team: ProjectMember[];
  onAdded: () => void;
};

const NO_PERSON_OPTION: SelectOption = { value: NO_PERSON, label: "Escolha uma pessoa" };

function toPersonOption(member: OrganizationMember): SelectOption {
  return { value: member.userId, label: `${member.name} (${member.email})` };
}

export function ProjectMemberForm({ projectId, team, onAdded }: ProjectMemberFormProps) {
  const { form, onSubmit, isSaving, organizationMembers } = useAddProjectMember({
    projectId,
    onAdded,
  });
  const { errors } = form.formState;

  return (
    <QueryContent
      query={organizationMembers}
      loadingLabel="Carregando os membros da organização…"
      errorTitle="Não foi possível carregar os membros da organização"
    >
      {members => {
        const candidates = listTeamCandidates(members, team);

        if (candidates.length === 0) {
          return <Notice>Todos os membros da organização já estão neste time.</Notice>;
        }

        return (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <SelectField
              label="Pessoa"
              options={[NO_PERSON_OPTION, ...candidates.map(toPersonOption)]}
              error={errors.userId?.message}
              {...form.register("userId")}
            />
            <SelectField
              label="Papel no projeto"
              options={PROJECT_ROLE_OPTIONS}
              error={errors.role?.message}
              {...form.register("role")}
            />
            <Button type="submit" isLoading={isSaving}>
              Incluir no time
            </Button>
          </form>
        );
      }}
    </QueryContent>
  );
}
