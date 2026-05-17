import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import type { GatewayFailure } from "../shapes/GatewayFailure.ts";
import type { StoredEvent } from "../shapes/StoredEvent.ts";

export interface LoadEventsFrom<
  TEvent extends DomainEvent,
  TResult = Promise<StoredEvent<TEvent>[] | GatewayFailure>,
> {
  loadFrom(globalPosition: number, limit?: number): TResult;
}
