import { z } from "zod";

export const membershipId = z.uuid({ version: "v7" }).brand<"MembershipId">();
export type MembershipId = {
  parsed: z.infer<typeof membershipId>;
  input: z.input<typeof membershipId>;
};
