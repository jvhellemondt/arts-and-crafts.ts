import type { ConsumeEvents } from "./ConsumeEvents.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

export interface RegisterEventSubscriber<TResult = Promise<void>> {
  subscribe(stream: string, handler: ConsumeEvents<DomainEvent>): TResult;
}
