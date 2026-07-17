import type { DomainEvent } from "../shapes/DomainEvent.ts";
import type { Failure } from "../shapes/Failure.ts";

export interface StoreDomainEvents<
  TDomainEvent extends DomainEvent,
  TReturn = Promise<void | Failure>,
> {
  store(events: TDomainEvent[]): TReturn;
}
