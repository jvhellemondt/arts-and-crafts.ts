import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

export interface ConsumeEvents<TEvent extends DomainEvent, TResult = Promise<void>> {
  consume(anEvent: TEvent): TResult;
}
