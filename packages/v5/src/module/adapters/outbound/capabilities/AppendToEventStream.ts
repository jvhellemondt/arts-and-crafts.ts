import type { DomainEvent } from "../../../core/shapes/DomainEvent.ts";

export interface AppendToEventStream<TDomainEvent extends DomainEvent, TReturn = Promise<void>> {
  append(streamName: string, aggregateId: string, events: TDomainEvent[]): TReturn;
}
