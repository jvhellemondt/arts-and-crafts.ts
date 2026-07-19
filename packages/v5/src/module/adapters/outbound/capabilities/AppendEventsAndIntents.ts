import type { DomainEvent } from "../../../core/shapes/DomainEvent.ts";
import type { Intent } from "../../../core/shapes/Intent.ts";
import type { GatewayFailure } from "../shapes/GatewayFailure.ts";

/**
 * Persists the domain events produced by an accepted decision together with
 * the intents they imply, as a single atomic unit — the outbound-adapter
 * equivalent of one database transaction wrapping both writes.
 *
 * This exists because appending events and staging intents through two
 * independent calls (`AppendToEventStore` + `StageIntents`) allows one to
 * succeed while the other fails, leaving the event stream and the outbox
 * inconsistent. `AppendEventsAndIntents` collapses that into one call so an
 * adapter can guarantee: either both land, or neither does.
 */
export interface AppendEventsAndIntents<
  TDomainEvent extends DomainEvent,
  TIntent extends Intent,
  TReturn = Promise<void | GatewayFailure>,
> {
  appendEventsAndIntents(events: TDomainEvent[], intents: TIntent[]): TReturn;
}
