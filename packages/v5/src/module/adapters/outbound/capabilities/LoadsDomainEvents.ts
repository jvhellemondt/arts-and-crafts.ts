import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

export interface LoadsDomainEvents<TEvent extends DomainEvent, TResult = Promise<TEvent[]>> {
  load(streamName: string, aggregateId: string): TResult;
}
