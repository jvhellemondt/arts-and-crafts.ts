import type { DomainEvent } from "../../../core/shapes/DomainEvent.ts";
import type { GatewayFailure } from "../shapes/GatewayFailure.ts";
import type { StreamKey } from "../shapes/StreamKey.ts";

/**
 * Appends events while guarding the dynamic consistency boundary they were
 * decided against: `versions` is what `LoadDomainEvents` returned alongside
 * the events (see `DynamicConsistencyResult`). The append only lands while
 * every concern in it still stands at the version that was read.
 */
export interface AppendToEventStore<
  TDomainEvent extends DomainEvent,
  TReturn = Promise<void | GatewayFailure>,
> {
  append(events: TDomainEvent[], versions: Record<StreamKey, number>): TReturn;
}
