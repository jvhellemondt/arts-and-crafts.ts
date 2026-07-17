import type { DomainEvent } from "../../../core/shapes/DomainEvent.ts";
import type { GatewayFailure } from "../shapes/GatewayFailure.ts";
import type { StreamKey } from "../shapes/StreamKey.ts";

export interface LoadDomainEvents<
  TEvent extends DomainEvent,
  TResult = Promise<TEvent[] | GatewayFailure>,
> {
  load(concerns: readonly StreamKey[]): TResult;
}
