import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

/**
 * StoredEvent wraps a DomainEvent for persistence in the global event log. With
 * Dynamic Consistency Boundaries there are no per-aggregate streams: events are
 * selected by their tags, and `globalPosition` is the sole ordering and
 * consistency token. This table must be immutable, append-only.
 */
export type StoredEvent<TEvent extends DomainEvent> = {
  /** Global position in the store; ordering and consistency token. */
  readonly globalPosition: number;
  /** Write-time, distinct from event.timestamp */
  readonly insertedAt: number;
  /** The actual domain event. */
  readonly event: TEvent;
};
