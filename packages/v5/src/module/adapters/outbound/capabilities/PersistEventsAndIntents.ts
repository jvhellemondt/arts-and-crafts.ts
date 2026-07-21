import type { DomainEvent } from "../../../core/shapes/DomainEvent.ts";
import type { EventsAndIntents } from "../../../core/shapes/EventsAndIntents.ts";
import type { Intent } from "../../../core/shapes/Intent.ts";
import type { GatewayFailure } from "../shapes/GatewayFailure.ts";

/**
 * Persists an `EventsAndIntents` pairing as a single atomic unit — the
 * outbound-adapter equivalent of one database transaction wrapping both
 * writes.
 *
 * This exists because appending events and staging intents through two
 * independent calls (`AppendToEventStore` + `StageIntents`) allows one to
 * succeed while the other fails, leaving the event stream and the outbox
 * inconsistent. `PersistEventsAndIntents` collapses that into one call so an
 * adapter can guarantee: either both land, or neither does.
 */
export interface PersistEventsAndIntents<
  TDomainEvent extends DomainEvent,
  TIntent extends Intent,
  TReturn = Promise<void | GatewayFailure>,
> {
  persist(payload: EventsAndIntents<TDomainEvent, TIntent>): TReturn;
}
