import type {
  StageTableRows,
  LoadTableRows,
  CoordinateTransactions,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import { type ResultAsync, okAsync } from "neverthrow";

/**
 * One shared "database" for the in-memory adapters: table name -> that
 * table's rows. Mirrors what a single SQL connection is to multiple tables —
 * `InMemoryEventStore` and `InMemoryOutbox` can be pointed at the same
 * `InMemoryDatasource` so their writes land in one physical store instead of
 * two independently-owned ones.
 *
 * Starts in autocommit mode: `write()` lands directly in the table, visible
 * immediately — the same behaviour any standalone in-memory adapter had
 * before this existed. `begin()` opens a transaction: subsequent `write()`s
 * only stage their rows, invisible via `read()` until `commit()` flushes
 * everything staged at once, or `rollback()` discards it — either way,
 * control returns to autocommit afterward. This is what
 * `InMemoryTransactionalWriter` uses: `begin()`, append the events, stage
 * the intents, then `commit()` only if both succeeded, `rollback()`
 * otherwise — so a write made *outside* that transaction (e.g. staging a
 * standalone rejection notification) still commits immediately, exactly
 * like a connection that isn't mid-transaction.
 *
 * Implements the library's `StageTableRows`/`LoadTableRows`/
 * `CoordinateTransactions` capabilities (see `docs/adr/0011`) — everything
 * here returns `ResultAsync` even though nothing can actually fail, so a
 * real backend (DynamoDB, Postgres) can satisfy the exact same three
 * capabilities without `InMemoryEventStore`/`InMemoryOutbox`/
 * `InMemoryTransactionalWriter` needing to change.
 *
 * The map is intentionally untyped at this shared boundary — each store owns
 * and casts to its own row shape for its own table, the same way a real
 * transaction client hands out an opaque connection that each repository
 * narrows for itself.
 */
export const EVENT_STORE_TABLE = "event_store";
export const EVENT_TAGS_TABLE = "event_tags";
export const OUTBOX_TABLE = "outbox";

export type TableName = typeof EVENT_STORE_TABLE | typeof EVENT_TAGS_TABLE | typeof OUTBOX_TABLE;

type DatasourceMode = "autocommit" | "atomic";

type StagedWrite = { readonly table: TableName; readonly rows: unknown[] };

export class InMemoryDatasource
  implements
    StageTableRows<TableName, ResultAsync<void, GatewayFailure>>,
    LoadTableRows<TableName, ResultAsync<unknown[], GatewayFailure>>,
    CoordinateTransactions<ResultAsync<void, GatewayFailure>>
{
  private readonly tables = new Map<TableName, unknown[]>();
  private staged: StagedWrite[] = [];
  private mode: DatasourceMode = "autocommit";

  private rowsFor(table: TableName): unknown[] {
    if (!this.tables.has(table)) this.tables.set(table, []);
    return this.tables.get(table)!;
  }

  /** Always returns committed rows — staged-but-uncommitted writes are invisible until `commit()`. */
  read<TRow = unknown>(table: TableName): ResultAsync<TRow[], GatewayFailure> {
    return okAsync(this.rowsFor(table) as TRow[]);
  }

  write(table: TableName, rows: unknown[]): ResultAsync<void, GatewayFailure> {
    if (this.mode === "autocommit") {
      this.rowsFor(table).push(...rows);
      return okAsync(undefined);
    }
    this.staged.push({ table, rows });
    return okAsync(undefined);
  }

  /** Opens a transaction: `write()` stages instead of landing immediately, until `commit()`/`rollback()`. */
  begin(): ResultAsync<void, GatewayFailure> {
    this.mode = "atomic";
    return okAsync(undefined);
  }

  /** Flushes every staged write since `begin()`, atomically, then returns to autocommit. */
  commit(): ResultAsync<void, GatewayFailure> {
    for (const { table, rows } of this.staged) this.rowsFor(table).push(...rows);
    this.staged = [];
    this.mode = "autocommit";
    return okAsync(undefined);
  }

  /** Discards every staged write since `begin()` without making any of it visible, then returns to autocommit. */
  rollback(): ResultAsync<void, GatewayFailure> {
    this.staged = [];
    this.mode = "autocommit";
    return okAsync(undefined);
  }
}
