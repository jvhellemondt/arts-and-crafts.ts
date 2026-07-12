import type { Query } from "@arts-and-crafts/v5/useCases/query/shapes";
import type { HandleQuery } from "@arts-and-crafts/v5/useCases/query/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import { hasFailures } from "../../core/hasFailures.ts";
import { FailureError } from "../../adapters/inbound/FailureError.ts";

/**
 * Builds the query, calls `handler.handle`, and throws `FailureError` on
 * failure so hosts can short-circuit via their own native error handling.
 * Queries never reject — only commands do.
 */
export function runQuery<TPayload, TQuery extends Query, TData>(
  createQuery: (payload: TPayload, metadata: Metadata) => TQuery,
  handler: HandleQuery<TQuery, Promise<GatewayFailure[] | TData>>,
) {
  return async (payload: TPayload, metadata: Metadata): Promise<TData> => {
    const query = createQuery(payload, metadata);
    const result = await handler.handle(query);
    if (hasFailures(result)) throw new FailureError(result);
    return result as TData;
  };
}
