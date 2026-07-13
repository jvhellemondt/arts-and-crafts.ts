import { v7 as uuidv7 } from "uuid";
import type { Query } from "@arts-and-crafts/v5/useCases/query/shapes";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";

export function createQuery<TType extends string, TPayload>(
  type: TType,
  payload: TPayload,
  metadata: Metadata,
): Query<TType, TPayload> {
  return {
    type,
    kind: "query",
    timestamp: new Date().getTime(),
    id: uuidv7(),
    payload,
    metadata,
  };
}
