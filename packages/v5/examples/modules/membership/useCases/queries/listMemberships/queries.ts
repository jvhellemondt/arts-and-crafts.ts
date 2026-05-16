import type { Metadata } from "@core/shapes/Metadata.ts";
import type { Query } from "@useCases/query/shapes/Query.ts";
import { v7 as uuidv7 } from "uuid";

export type ListMembershipsPayload = Record<string, never>;

export function createListMembershipsQuery(
  metadata: Metadata,
): Query<"ListMemberships", ListMembershipsPayload> {
  return {
    type: "ListMemberships",
    kind: "query",
    timestamp: new Date().getTime(),
    id: uuidv7(),
    payload: {},
    metadata,
  };
}

export type ListMembershipsQuery = ReturnType<typeof createListMembershipsQuery>;
