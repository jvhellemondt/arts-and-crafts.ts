import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import type { StreamKey } from "./StreamKey.ts";

/**
 * StoredEvent wraps a DomainEvent for persistence in the event store with its
 * stream coordinates and version. This table must be immutable, append-only.
 */
export type StoredEvent<TEvent extends DomainEvent> = {
  /** The stream name, e.g., `${aggregateType}`. */
  stream: string;
  /** Stream key, e.g., `${aggregateType}#${aggregateId}`. */
  streamKey: StreamKey;
  /** Version within the stream */
  streamVersion: number;
  /** Global position in the store */
  globalPosition: number;
  /** Write-time, distinct from event.timestamp */
  insertedAt: number;
  /** The actual domain event. */
  event: TEvent;
};
