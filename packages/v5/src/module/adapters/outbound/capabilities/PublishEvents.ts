import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

export interface PublishEvents<TEvent extends DomainEvent, TResult = Promise<void>> {
  publish(events: TEvent[]): TResult;
}
