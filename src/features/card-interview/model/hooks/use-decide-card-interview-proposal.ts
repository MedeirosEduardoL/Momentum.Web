import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { applyApiErrors } from "@/shared/api/apply-api-errors";
import { toastApiError } from "@/shared/api/toast-api-error";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { useDecideCardInterviewProposalMutation } from "../../api/card-interview.mutations";
import { isProposalOutdated } from "../lib/card-interview-failure";
import { chooseFields } from "../lib/proposal-changes";
import {
  proposalDecisionSchema,
  type ProposalDecisionFormValues,
} from "../schemas/proposal-decision.schema";
import type {
  CardInterviewProposal,
  CardInterviewProposalDecision,
} from "../types/card-interview.types";

const proposalDecisionResolver = zodResolver(proposalDecisionSchema);

export type ProposalChoice = "close" | "continue" | "discard";

function choiceOf(decision: CardInterviewProposalDecision): ProposalChoice {
  if (decision.status === "discarded") {
    return "discard";
  }

  return decision.closeInterview ? "close" : "continue";
}

export function useDecideCardInterviewProposal(proposal: CardInterviewProposal) {
  const deciding = useDecideCardInterviewProposalMutation();
  const [isOutdated, setIsOutdated] = useState(false);
  const form = useForm<ProposalDecisionFormValues>({
    resolver: proposalDecisionResolver,
    defaultValues: { fields: proposal.changes.map(change => change.field) },
  });

  function refuse(error: unknown) {
    applyApiErrors(form, error);
    setIsOutdated(isProposalOutdated(error));
  }

  const apply = (closeInterview: boolean) =>
    form.handleSubmit(async ({ fields }) => {
      try {
        await deciding.mutateAsync({
          proposalId: proposal.id,
          status: "applied",
          fields: chooseFields(proposal, fields),
          closeInterview,
        });
        toast.success("As mudanças escolhidas foram aplicadas ao card.");
      } catch (error) {
        refuse(error);
      }
    })();

  async function discard() {
    try {
      await deciding.mutateAsync({ proposalId: proposal.id, status: "discarded" });
      toast.success("A proposta foi descartada.");
    } catch (error) {
      toastApiError(error);
    }
  }

  const pendingChoice =
    deciding.isPending && deciding.variables ? choiceOf(deciding.variables) : null;

  return { form, apply, discard, pendingChoice, isDeciding: deciding.isPending, isOutdated };
}
