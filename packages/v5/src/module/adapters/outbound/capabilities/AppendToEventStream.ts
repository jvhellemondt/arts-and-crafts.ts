import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import type { AppendCondition } from "../shapes/AppendCondition.ts";
import type { AppendConflict } from "../shapes/AppendConflict.ts";
import type { GatewayFailure } from "../shapes/GatewayFailure.ts";

/**
 * Appends events to the global log. When a `condition` is supplied the store
 * must reject the append atomically if any event matching the condition's query
 * was appended after its position — this is the DCB replacement for
 * per-aggregate optimistic locking. `condition` is optional so unconditional
 * appends (e.g. seeding fixtures) remain possible.
 */
export interface AppendToEventStream<
  TDomainEvent extends DomainEvent,
  TReturn = Promise<void | GatewayFailure | AppendConflict>,
> {
  append(events: TDomainEvent[], condition?: AppendCondition): TReturn;
}
