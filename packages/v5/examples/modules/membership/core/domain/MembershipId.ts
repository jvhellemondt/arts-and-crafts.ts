import { z } from "zod";

export const membershipId = z.uuid({ version: "v7" }).brand<"MembershipId">();
export type MembershipId = z.infer<typeof membershipId>;
