import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import type { ConsistencyPosition } from "./ConsistencyPosition.ts";

/**
 * The result of reading a dynamic consistency boundary: the events matching the
 * query, plus the store-wide position observed at read time. The position — not
 * the position of the last matching event — is what the append condition checks
 * against, so a concurrent write matching the same query can be detected.
 */
export interface ReadResult<TEvent extends DomainEvent> {
  readonly events: readonly TEvent[];
  /** Highest globalPosition observed across the whole log at read time. */
  readonly position: ConsistencyPosition;
}
