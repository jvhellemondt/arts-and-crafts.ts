import type { DomainEvent } from "../../../core/shapes/DomainEvent.ts";

export interface AppendToStream<TDomainEvent extends DomainEvent, TReturn = Promise<void>> {
  append(streamName: string, aggregateId: string, events: TDomainEvent[]): TReturn;
}
