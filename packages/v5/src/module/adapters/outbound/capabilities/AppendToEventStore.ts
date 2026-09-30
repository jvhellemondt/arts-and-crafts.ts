import type { DomainEvent } from "../../../core/shapes/DomainEvent.ts";
import type { GatewayFailure } from "../shapes/GatewayFailure.ts";
import type { StreamKey } from "../shapes/StreamKey.ts";

export interface AppendToEventStore<
  TDomainEvent extends DomainEvent,
  TReturn = Promise<void | GatewayFailure>,
> {
  append(events: TDomainEvent[], versions: Record<StreamKey, number>): TReturn;
}
