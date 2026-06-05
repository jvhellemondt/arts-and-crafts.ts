import type { Metadata } from "@core/shapes/Metadata.ts";
import { membershipStatus } from "@examples/modules/membership/core/domain/MembershipStatus.ts";
import { MEMBERSHIP_AGGREGATE } from "@examples/modules/membership/core/state.ts";
import type { Query } from "@useCases/query/shapes/Query.ts";
import { v7 as uuidv7 } from "uuid";
import z from "zod";

export const listMembershipsQueryPayload = z.object({
  status: membershipStatus.optional(),
});

export type ListMembershipsQueryPayload = z.output<typeof listMembershipsQueryPayload>;

export function createListMembershipsQuery(
  payload: ListMembershipsQueryPayload,
  metadata: Metadata,
): Query<"ListMemberships", ListMembershipsQueryPayload> {
  return {
    type: "ListMemberships",
    kind: "query",
    timestamp: new Date().getTime(),
    id: uuidv7(),
    aggregateType: MEMBERSHIP_AGGREGATE,
    aggregateId: "",
    payload,
    metadata,
  };
}

export type ListMembershipsQuery = ReturnType<typeof createListMembershipsQuery>;
