/**
 * A query is just the criteria needed to fetch data — its `payload` — paired
 * with a result type (see `HandleQuery`). Unlike commands/events/intents it is
 * not persisted or published, so it deliberately does not extend `Message`:
 * there is no id, timestamp, or tracing `Metadata` for the read path to carry.
 * Cross-cutting concerns like request correlation live in the transport layer.
 */
export interface Query<TPayload = unknown> {
  readonly payload: TPayload;
}
