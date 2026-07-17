import { membershipStatus } from "@examples/modules/membership/core/domain/MembershipStatus.ts";
import z from "zod";

export const listMembershipsQuery = z.object({
  status: membershipStatus.optional(),
});

export type ListMembershipsQuery = z.output<typeof listMembershipsQuery>;
