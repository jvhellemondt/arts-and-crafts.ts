import type { DomainEvent } from "../../../core/shapes/DomainEvent.ts";

export interface AppendToEventStore<TDomainEvent extends DomainEvent, TReturn = Promise<void>> {
  append(events: TDomainEvent[], expectedPosition?: number): TReturn;
}
