import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { Project } from "@/features/project";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { useCreateInvitationMutation } from "../../api/invitation.mutations";
import { toDefaultProjectRoles, toInvitationProjects } from "../lib/invitation-projects";
import { invitationSchema, type InvitationFormValues } from "../schemas/invitation.schema";

type InviteMemberOptions = {
  projects: Project[];
  onInvited: () => void;
};

const PROJECTS_ERROR_FIELD = "root.projects";

const invitationResolver = zodResolver(invitationSchema);

export function useInviteMember({ projects, onInvited }: InviteMemberOptions) {
  const createInvitation = useCreateInvitationMutation();
  const form = useForm<InvitationFormValues>({
    resolver: invitationResolver,
    defaultValues: { email: "", role: "member", projectRoles: toDefaultProjectRoles(projects) },
  });

  const onSubmit = form.handleSubmit(async ({ email, role, projectRoles }) => {
    try {
      await createInvitation.mutateAsync({
        email,
        role,
        projects: toInvitationProjects(projectRoles),
      });
      toast.success(`Convite enviado para ${email}.`);
      onInvited();
    } catch (error) {
      applyApiErrors(form, error, { projects: PROJECTS_ERROR_FIELD });
    }
  });

  return {
    form,
    onSubmit,
    isSaving: createInvitation.isPending,
    projectsError: form.formState.errors.root?.projects?.message,
  };
}
