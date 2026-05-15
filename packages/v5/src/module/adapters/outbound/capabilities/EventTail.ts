import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import type { PublishEvents } from "./PublishEvents.ts";

export interface EventTail<TEvent extends DomainEvent, TResult = Promise<void>> {
  withEventTail(publisher: PublishEvents<TEvent>): TResult;
}
