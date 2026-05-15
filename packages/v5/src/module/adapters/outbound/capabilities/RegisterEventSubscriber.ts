import type { ConsumeEvents } from "./ConsumeEvents.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

export interface RegisterEventSubscriber<TEvent extends DomainEvent = DomainEvent, TResult = void> {
  subscribe<T extends TEvent>(
    aggregateType: T["aggregateType"],
    handler: ConsumeEvents<T>,
  ): TResult;
}
