import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import type { StreamKey } from "./StreamKey.ts";

/**
 * StoredEvent wraps a DomainEvent for persistence in the event store with its
 * stream coordinates and version. This table must be immutable, append-only.
 */
export type StoredEvent<TEvent extends DomainEvent> = {
  /** The stream name, e.g., `${aggregateType}`. */
  readonly stream: string;
  /** Stream key, e.g., `${aggregateType}#${aggregateId}`. */
  readonly streamKey: StreamKey;
  /** Version within the stream */
  readonly streamVersion: number;
  /** Global position in the store */
  readonly globalPosition: number;
  /** Write-time, distinct from event.timestamp */
  readonly insertedAt: number;
  /** The actual domain event. */
  readonly event: TEvent;
};
