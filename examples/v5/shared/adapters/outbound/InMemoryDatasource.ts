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

export class InMemoryDatasource {
  private readonly tables = new Map<TableName, unknown[]>();
  private staged: StagedWrite[] = [];
  private mode: DatasourceMode = "autocommit";

  /** Always returns committed rows — staged-but-uncommitted writes are invisible until `commit()`. */
  read<TRow>(table: TableName): TRow[] {
    if (!this.tables.has(table)) this.tables.set(table, []);
    return this.tables.get(table)! as TRow[];
  }

  write(table: TableName, rows: unknown[]): void {
    if (this.mode === "autocommit") {
      this.read(table).push(...rows);
      return;
    }
    this.staged.push({ table, rows });
  }

  /** Opens a transaction: `write()` stages instead of landing immediately, until `commit()`/`rollback()`. */
  begin(): void {
    this.mode = "atomic";
  }

  /** Flushes every staged write since `begin()`, atomically, then returns to autocommit. */
  commit(): void {
    for (const { table, rows } of this.staged) this.read(table).push(...rows);
    this.staged = [];
    this.mode = "autocommit";
  }

  /** Discards every staged write since `begin()` without making any of it visible, then returns to autocommit. */
  rollback(): void {
    this.staged = [];
    this.mode = "autocommit";
  }
}
