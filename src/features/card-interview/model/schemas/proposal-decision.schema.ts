import { z } from "zod";

export const proposalDecisionSchema = z.object({
  fields: z.array(z.string()).min(1, "Escolha ao menos uma mudança para aplicar."),
});

export type ProposalDecisionFormValues = z.infer<typeof proposalDecisionSchema>;
