import { useForm } from "react-hook-form";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { useRegisterAccountMutation } from "../../api/account.mutations";
import { signUpSchema, type SignUpFormValues } from "../schemas/sign-up.schema";

export function useSignUp() {
  const registerAccount = useRegisterAccountMutation();
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = form.handleSubmit(async values => {
    try {
      await registerAccount.mutateAsync(values);
    } catch (error) {
      applyApiErrors(form, error);
    }
  });

  return {
    form,
    onSubmit,
    isSaving: registerAccount.isPending,
    sentTo: registerAccount.isSuccess ? registerAccount.variables.email : null,
  };
}
