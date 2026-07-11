import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import type { Query } from "@arts-and-crafts/v5/useCases/query/shapes";
import { membershipStatus } from "@examples/modules/membership/core/domain/MembershipStatus.ts";
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
    payload,
    metadata,
  };
}

export type ListMembershipsQuery = ReturnType<typeof createListMembershipsQuery>;
