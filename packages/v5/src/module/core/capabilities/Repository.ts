import type { AppendCondition } from "@adapters/outbound/shapes/AppendCondition.ts";
import type { AppendConflict } from "@adapters/outbound/shapes/AppendConflict.ts";
import type { ConsistencyPosition } from "@adapters/outbound/shapes/ConsistencyPosition.ts";
import type { DcbQuery } from "@adapters/outbound/shapes/DcbQuery.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

/**
 * The decision state folded from a consistency boundary, together with the
 * position it was read at. The position becomes the `after` of the append
 * condition so a write can detect a concurrent event entering the same boundary.
 */
export interface LoadedState<TState> {
  readonly state: TState;
  readonly position: ConsistencyPosition;
}

/**
 * A per-command repository: the DCB unit that owns one decision. `load` reads
 * the events inside the command's boundary (`query`) and folds them into the
 * command's own decision state; `store` appends new events under the append
 * condition built from the read position. There is one repository per command,
 * not one per aggregate — the boundary is chosen by the decision, not fixed.
 */
export interface Repository<
  TState,
  TEvent extends DomainEvent,
  TLoad = Promise<LoadedState<TState> | GatewayFailure>,
  TStore = Promise<void | GatewayFailure | AppendConflict>,
> {
  load(query: DcbQuery): TLoad;
  store(events: TEvent[], condition: AppendCondition): TStore;
}
