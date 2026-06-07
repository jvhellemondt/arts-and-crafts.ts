import type { ConsistencyPosition } from "@adapters/outbound/shapes/ConsistencyPosition.ts";
import type { DcbQuery } from "@adapters/outbound/shapes/DcbQuery.ts";

/**
 * The folded state of a dynamic consistency boundary, plus the position it was
 * read at. The position becomes the `after` of the append condition, so the
 * write can detect a concurrent event that entered the same boundary.
 */
export interface DecisionModel<TState> {
  readonly state: TState;
  readonly position: ConsistencyPosition;
}

/**
 * The DCB analogue of loading an aggregate: read the events matching `query`,
 * fold them into a decision state, and return that state with the read
 * position. Replaces `LoadAggregateState`, which loaded a single aggregate
 * stream by id.
 */
export interface BuildDecisionModel<TState, TReturn = Promise<DecisionModel<TState>>> {
  build(query: DcbQuery): TReturn;
}
