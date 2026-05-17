import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import type { StoredEvent } from "../shapes/StoredEvent.ts";

export interface PublishEvents<TEvent extends DomainEvent, TResult = Promise<void>> {
  publish(events: StoredEvent<TEvent>[]): TResult;
}
