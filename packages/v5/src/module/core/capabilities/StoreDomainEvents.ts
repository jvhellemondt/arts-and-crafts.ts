import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

export interface StoreDomainEvents<TDomainEvent extends DomainEvent, TReturn = Promise<void>> {
  store(events: TDomainEvent[]): TReturn;
}
