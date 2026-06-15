import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import type { StreamKey } from "../shapes/StreamKey.ts";

export interface LoadDomainEvents<TEvent extends DomainEvent, TResult = Promise<TEvent[]>> {
  load(concerns: readonly StreamKey[]): TResult;
}
