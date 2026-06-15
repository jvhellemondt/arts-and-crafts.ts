import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

/**
 * StoredEvent wraps a DomainEvent for persistence in the event store based on its concerns.
 * This table must be immutable, append-only.
 */
export type StoredEvent<TEvent extends DomainEvent> = {
  /** Global position in the store */
  readonly globalPosition: number;
  /** Write-time, distinct from event.timestamp */
  readonly insertedAt: number;
  /** The actual domain event. */
  readonly event: TEvent;
  /** Concerns (streamkeys) of the event, hoisted */
  readonly concerns: TEvent["concerns"];
};
