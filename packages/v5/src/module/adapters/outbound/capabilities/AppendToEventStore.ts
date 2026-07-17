import type { DomainEvent } from "../../../core/shapes/DomainEvent.ts";
import type { GatewayFailure } from "../shapes/GatewayFailure.ts";

export interface AppendToEventStore<
  TDomainEvent extends DomainEvent,
  TReturn = Promise<void | GatewayFailure>,
> {
  append(events: TDomainEvent[], expectedPosition?: number): TReturn;
}
