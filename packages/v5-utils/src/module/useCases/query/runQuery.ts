import type { Query } from "@arts-and-crafts/v5/useCases/query/shapes";
import type { HandleQuery } from "@arts-and-crafts/v5/useCases/query/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import { hasFailures } from "../../core/hasFailures.ts";
import { FailureError } from "../../adapters/inbound/FailureError.ts";

/**
 * Calls `handler.handle(query)`, and throws `FailureError` on failure so
 * hosts can short-circuit via their own native error handling. Queries never
 * reject — only commands do.
 */
export async function runQuery<TQuery extends Query, TData>(
  query: TQuery,
  handler: HandleQuery<TQuery, Promise<GatewayFailure[] | TData>>,
): Promise<TData> {
  const result = await handler.handle(query);
  if (hasFailures(result)) throw new FailureError(result);
  return result as TData;
}
