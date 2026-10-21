import { useRef, useState } from "react";
import { useGetCurrentOrganization } from "@/features/organization";
import { hasErrorCode } from "@/shared/api/api-error";
import { useGenerateCardBriefMutation } from "../../api/card-brief.mutations";

const NOT_ENABLED = "CardBriefNotEnabled";

export function useGenerateCardBrief(cardId: string) {
  const organization = useGetCurrentOrganization();
  const generating = useGenerateCardBriefMutation();
  const [failure, setFailure] = useState<unknown>(null);
  const isRunning = useRef(false);

  function refuse(error: unknown) {
    setFailure(error);

    if (hasErrorCode(error, NOT_ENABLED)) {
      void organization.refetch();
    }
  }

  async function generate() {
    if (isRunning.current) {
      return;
    }

    isRunning.current = true;
    setFailure(null);

    try {
      await generating.mutateAsync(cardId);
    } catch (error) {
      refuse(error);
    } finally {
      isRunning.current = false;
    }
  }

  return { generate, isGenerating: generating.isPending, failure };
}
