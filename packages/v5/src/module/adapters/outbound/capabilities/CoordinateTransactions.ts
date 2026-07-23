import type { GatewayFailure } from "../shapes/GatewayFailure.ts";

/**
 * Coordinates an atomic write across multiple stores that share one
 * datasource (see `StageTableRows`) — e.g. an event store and an outbox, so
 * an accepted decision's events and intents either both land or neither
 * does.
 *
 * `begin()` opens the transaction: subsequent `write()`s queue instead of
 * landing. `commit()` submits every queued write as one atomic operation
 * and returns to autocommit; `rollback()` discards them instead, also
 * returning to autocommit. See `docs/adr/0011`.
 */
export interface CoordinateTransactions<TReturn = Promise<void | GatewayFailure>> {
  begin(): TReturn;
  commit(): TReturn;
  rollback(): TReturn;
}
