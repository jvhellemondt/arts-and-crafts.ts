import { ResultAsync, err, ok } from "neverthrow";
import type { Query } from "@arts-and-crafts/v5/useCases/query/shapes";
import type { HandleQuery } from "@arts-and-crafts/v5/useCases/query/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import { hasFailures } from "../../core/hasFailures.ts";

/**
 * Calls `handler.handle(query)` and threads the outcome through neverthrow:
 * the data as `Ok` on success, or the domain's own `GatewayFailure[]` as `Err`
 * — as values, not thrown. Queries never reject; only commands do. A handler
 * that rejects unexpectedly rejects the returned promise, so the host's error
 * boundary still treats it as a genuine 500.
 */
export function runQuery<TQuery extends Query, TData>(
  query: TQuery,
  handler: HandleQuery<TQuery, Promise<GatewayFailure[] | TData>>,
): ResultAsync<TData, readonly GatewayFailure[]> {
  return ResultAsync.fromSafePromise(handler.handle(query)).andThen((result) =>
    hasFailures(result) ? err(result) : ok(result as TData),
  );
}
