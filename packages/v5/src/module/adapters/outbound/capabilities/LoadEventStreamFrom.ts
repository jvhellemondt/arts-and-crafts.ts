import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import type { GatewayFailure } from "../shapes/GatewayFailure.ts";
import type { StoredEvent } from "../shapes/StoredEvent.ts";
import type { StreamKey } from "../shapes/StreamKey.ts";

export interface LoadEventStreamFrom<
  TEvent extends DomainEvent,
  TResult = Promise<StoredEvent<TEvent>[] | GatewayFailure>,
> {
  loadStreamFrom(streamKey: StreamKey, fromVersion: number): TResult;
}
