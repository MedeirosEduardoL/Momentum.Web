import { z } from "zod";
import { emailSchema } from "@/shared/lib/field-schemas";

export const NOT_IN_TEAM = "none";

export const invitationSchema = z.object({
  email: emailSchema,
  role: z.enum(["administrator", "member"]),
  projectRoles: z.record(z.string(), z.enum([NOT_IN_TEAM, "administrator", "member"])),
});

export type InvitationFormValues = z.infer<typeof invitationSchema>;
