import type { Query } from "@arts-and-crafts/v5/useCases/query/shapes";
import { membershipStatus } from "@examples/modules/membership/core/domain/MembershipStatus.ts";
import z from "zod";

export const listMembershipsQueryPayload = z.object({
  status: membershipStatus.optional(),
});

export type ListMembershipsQueryPayload = z.output<typeof listMembershipsQueryPayload>;

export function createListMembershipsQuery(
  payload: ListMembershipsQueryPayload,
): Query<ListMembershipsQueryPayload> {
  return { payload };
}

export type ListMembershipsQuery = ReturnType<typeof createListMembershipsQuery>;
