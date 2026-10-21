import { useForm } from "react-hook-form";
import { useGetCurrentOrganization } from "@/features/organization";
import { hasErrorCode } from "@/shared/api/api-error";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { useCreateOrganizationMutation } from "../../api/first-access.mutations";
import { firstAccessSchema, type FirstAccessFormValues } from "../schemas/first-access.schema";

const ORGANIZATION_ALREADY_JOINED = "OrganizationAlreadyJoined";

const firstAccessResolver = zodResolver(firstAccessSchema);

export function useFirstAccess() {
  const organization = useGetCurrentOrganization();
  const createOrganization = useCreateOrganizationMutation();
  const form = useForm<FirstAccessFormValues>({
    resolver: firstAccessResolver,
    defaultValues: { organizationName: "" },
  });

  const onSubmit = form.handleSubmit(async ({ organizationName }) => {
    try {
      await createOrganization.mutateAsync(organizationName);
    } catch (error) {
      if (hasErrorCode(error, ORGANIZATION_ALREADY_JOINED)) {
        await organization.refetch();
        return;
      }

      applyApiErrors(form, error, { name: "organizationName" });
    }
  });

  return {
    form,
    onSubmit,
    isSaving: createOrganization.isPending,
    hasOrganization: Boolean(organization.data),
  };
}
