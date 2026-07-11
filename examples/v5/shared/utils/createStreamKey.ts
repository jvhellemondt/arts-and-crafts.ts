import type { StreamKey } from "@adapters/outbound/shapes/StreamKey.ts";

/**
 * Creates a StreamKey from a consistency anchor and an identifier.
 *
 * A StreamKey is a consistency anchor in the event store — a named point that
 * events can reference to enforce mutual exclusivity. The anchor is a domain
 * concept that names what the event is about (e.g. "Membership",
 * "EmailRegistration"); the id is the specific value within that domain concept
 * (e.g. a membership id, an email address).
 *
 * Unlike aggregates, an anchor does not imply a lifecycle, ownership, or
 * behaviour. It is a domain concept used purely as a concurrency boundary.
 *
 * @example
 * createStreamKey("Membership", "membership-123")       // "Membership#membership-123"
 * createStreamKey("EmailRegistration", "user@example.com") // "EmailRegistration#user@example.com"
 */
export function createStreamKey(anchor: string, id: string): StreamKey {
  return `${anchor}#${id}`;
}
