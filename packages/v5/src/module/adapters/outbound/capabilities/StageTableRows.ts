import type { GatewayFailure } from "../shapes/GatewayFailure.ts";

/**
 * Queues `rows` for `table` on a shared datasource. Lands immediately when
 * no transaction is open ("autocommit") — behaves exactly like a standalone
 * adapter with its own private store. While a transaction is open (see
 * `CoordinateTransactions`), the write is held rather than made visible, so
 * `commit()` can submit everything queued since `begin()` as one atomic
 * operation — the shape a backend with no live multi-request transaction
 * (e.g. DynamoDB's `TransactWriteItems`) requires, and one a backend with a
 * real live transaction (e.g. Postgres) can satisfy just as well.
 *
 * `rows` is intentionally untyped at this shared boundary — each store owns
 * and casts to its own row shape for the table(s) it writes to.
 */
export interface StageTableRows<
  TTable extends string = string,
  TReturn = Promise<void | GatewayFailure>,
> {
  write(table: TTable, rows: unknown[]): TReturn;
}
