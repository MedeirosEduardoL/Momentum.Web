import { useForm } from "react-hook-form";
import { useListOrganizationMembers } from "@/features/organization";
import { hasErrorCode } from "@/shared/api/api-error";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { useSetProjectMemberMutation } from "../../api/project.mutations";
import {
  NO_PERSON,
  projectMemberSchema,
  type ProjectMemberFormValues,
} from "../schemas/project-member.schema";

type AddProjectMemberOptions = {
  projectId: string;
  onAdded: () => void;
};

const MEMBER_OUTSIDE_ORGANIZATION = "ProjectMemberOutsideOrganization";

const projectMemberResolver = zodResolver(projectMemberSchema);

export function useAddProjectMember({ projectId, onAdded }: AddProjectMemberOptions) {
  const organizationMembers = useListOrganizationMembers();
  const addMember = useSetProjectMemberMutation();
  const form = useForm<ProjectMemberFormValues>({
    resolver: projectMemberResolver,
    defaultValues: { userId: NO_PERSON, role: "member" },
  });

  function forgetPersonWhoLeftTheOrganization() {
    form.setValue("userId", NO_PERSON);
    void organizationMembers.refetch();
  }

  const onSubmit = form.handleSubmit(async values => {
    try {
      await addMember.mutateAsync({ projectId, ...values });
      onAdded();
    } catch (error) {
      applyApiErrors(form, error);

      if (hasErrorCode(error, MEMBER_OUTSIDE_ORGANIZATION)) {
        forgetPersonWhoLeftTheOrganization();
      }
    }
  });

  return { form, onSubmit, isSaving: addMember.isPending, organizationMembers };
}
