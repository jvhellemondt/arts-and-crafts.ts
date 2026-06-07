import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import type { DcbQuery } from "../shapes/DcbQuery.ts";
import type { GatewayFailure } from "../shapes/GatewayFailure.ts";
import type { ReadResult } from "../shapes/ReadResult.ts";

/**
 * Reads the dynamic consistency boundary described by `query`: the events
 * matching it, plus the store-wide position observed at read time. Replaces the
 * per-aggregate `LoadDomainEvents.load(stream, aggregateId)`.
 */
export interface ReadEvents<
  TEvent extends DomainEvent,
  TResult = Promise<ReadResult<TEvent> | GatewayFailure>,
> {
  read(query: DcbQuery): TResult;
}
