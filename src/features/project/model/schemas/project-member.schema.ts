import { z } from "zod";

export const NO_PERSON = "";

export const projectMemberSchema = z.object({
  userId: z.string().min(1, "Escolha quem entra no time."),
  role: z.enum(["administrator", "member"]),
});

export type ProjectMemberFormValues = z.infer<typeof projectMemberSchema>;
