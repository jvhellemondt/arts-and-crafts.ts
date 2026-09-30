import type { DomainEvent } from "../../../core/shapes/DomainEvent.ts";
import type { StreamKey } from "./StreamKey.ts";

/**
 * What a load against a dynamic consistency boundary returns: the events
 * carrying any of the queried concerns, plus the version each of those
 * concerns stood at when they were read.
 *
 * The versions are the consistency boundary. A decider reads them along with
 * the events and hands them straight back to `AppendToEventStore.append`,
 * which only commits while every concern is still at the version that was
 * read — including concerns that were only read from and are not written to
 * by the resulting events.
 */
export type DynamicConsistencyResult<TEvent extends DomainEvent = DomainEvent> = {
  readonly events: TEvent[];
  readonly versions: Record<StreamKey, number>;
};
