import z from "zod";

export const membershipStatus = z
  .enum(["initial", "open", "active", "closed"])
  .brand<"MembershipStatus">();

export type MembershipStatus = {
  parsed: z.infer<typeof membershipStatus>;
  input: z.input<typeof membershipStatus>;
};
