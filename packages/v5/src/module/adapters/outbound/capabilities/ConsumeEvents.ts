import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import type { StoredEvent } from "../shapes/StoredEvent.ts";

export interface ConsumeEvents<TEvent extends DomainEvent, TResult = Promise<void>> {
  consume(anEvent: StoredEvent<TEvent>): TResult;
}
