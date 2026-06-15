import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

/**
 * StoredEvent wraps a DomainEvent for persistence in the event store with its
 * stream coordinates and version. This table must be immutable, append-only.
 */
export type StoredEvent<TEvent extends DomainEvent> = {
  /** Version within the stream */
  readonly streamVersion: number;
  /** Global position in the store */
  readonly globalPosition: number;
  /** Write-time, distinct from event.timestamp */
  readonly insertedAt: number;
  /** The actual domain event. */
  readonly event: TEvent;
};
