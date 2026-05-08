import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

export interface LoadDomainEvents<TEvent extends DomainEvent, TResult = Promise<TEvent[]>> {
  load(streamName: string, aggregateId: string): TResult;
}
