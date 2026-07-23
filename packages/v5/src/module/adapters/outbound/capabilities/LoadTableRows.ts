import type { GatewayFailure } from "../shapes/GatewayFailure.ts";

/**
 * Reads every row committed to `table`, bypassing any store's business-logic
 * filtering (e.g. `LoadPendingIntents` only returns `pending` intents, never
 * notifications or dispatched/failed rows). Exists for callers — typically
 * tests — that need to see raw committed state directly, the same way
 * `SimulateFaults` lets a caller inject faults regardless of which concrete
 * datasource backs the adapter under test.
 *
 * Untyped at this shared boundary, same as `StageTableRows` — callers cast
 * to their own row shape for the table they're inspecting.
 */
export interface LoadTableRows<
  TTable extends string = string,
  TReturn = Promise<unknown[] | GatewayFailure>,
> {
  read(table: TTable): TReturn;
}
