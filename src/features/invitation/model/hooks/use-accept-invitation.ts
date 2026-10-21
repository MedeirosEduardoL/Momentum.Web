import { useForm } from "react-hook-form";
import { hasErrorCode } from "@/shared/api/api-error";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { zodResolver } from "@/shared/lib/zod-resolver";
import {
  useAcceptInvitationMutation,
  useOpenSessionMutation,
} from "../../api/invitation.mutations";
import { useGetInvitationPreview } from "../../api/invitation.queries";
import {
  existingAccountAcceptanceSchema,
  newAccountAcceptanceSchema,
  type InvitationAcceptanceFormValues,
} from "../schemas/invitation-acceptance.schema";

const LINK_INVALID = "InvitationLinkInvalid";

const newAccountResolver = zodResolver(newAccountAcceptanceSchema);
const existingAccountResolver = zodResolver(existingAccountAcceptanceSchema);

type InvitationAcceptanceView = "loading" | "invalid" | "unavailable" | "form";

type AcceptInvitationOptions = {
  token: string | null;
  onAccepted: () => void;
  onSessionNotOpened: () => void;
};

export function useAcceptInvitation({
  token,
  onAccepted,
  onSessionNotOpened,
}: AcceptInvitationOptions) {
  const preview = useGetInvitationPreview(token);
  const acceptInvitation = useAcceptInvitationMutation();
  const openSession = useOpenSessionMutation();
  const accountExists = preview.data?.accountExists ?? false;
  const form = useForm<InvitationAcceptanceFormValues>({
    resolver: accountExists ? existingAccountResolver : newAccountResolver,
    defaultValues: { name: "", password: "" },
  });

  function resolveView(): InvitationAcceptanceView {
    if (token === null || hasErrorCode(acceptInvitation.error, LINK_INVALID)) {
      return "invalid";
    }

    if (preview.data) {
      return "form";
    }

    if (preview.isPending) {
      return "loading";
    }

    return hasErrorCode(preview.error, LINK_INVALID) ? "invalid" : "unavailable";
  }

  async function accept(invitationToken: string, values: InvitationAcceptanceFormValues) {
    try {
      await acceptInvitation.mutateAsync({
        token: invitationToken,
        name: accountExists ? null : values.name,
        password: values.password,
      });
      return true;
    } catch (error) {
      if (!hasErrorCode(error, LINK_INVALID)) {
        applyApiErrors(form, error);
      }

      return false;
    }
  }

  async function enter(email: string, password: string) {
    try {
      await openSession.mutateAsync({ email, password });
      onAccepted();
    } catch {
      onSessionNotOpened();
    }
  }

  const onSubmit = form.handleSubmit(async values => {
    if (token === null || !preview.data) {
      return;
    }

    if (await accept(token, values)) {
      await enter(preview.data.email, values.password);
    }
  });

  return {
    form,
    onSubmit,
    view: resolveView(),
    preview: preview.data,
    previewError: preview.error,
    retryPreview: () => preview.refetch(),
    isSaving: acceptInvitation.isPending || openSession.isPending,
  };
}
