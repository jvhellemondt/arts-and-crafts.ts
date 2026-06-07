import type { ConsistencyPosition } from "./ConsistencyPosition.ts";
import type { DcbQuery } from "./DcbQuery.ts";

/**
 * The optimistic-concurrency guard for an append. The store must reject the
 * append if any event matching `query` was appended after `after`. This
 * replaces per-aggregate `expectedVersion` with a query-scoped check.
 */
export interface AppendCondition {
  /** The boundary the writer reasoned about. */
  readonly query: DcbQuery;
  /** Append fails if any event matching `query` exists after this position. */
  readonly after: ConsistencyPosition;
}
