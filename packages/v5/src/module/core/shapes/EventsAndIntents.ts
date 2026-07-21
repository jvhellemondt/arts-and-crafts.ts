import type { DomainEvent } from "./DomainEvent.ts";
import type { Intent } from "./Intent.ts";

/**
 * A domain event stream paired with the intents produced alongside it — the
 * "what must be persisted together" bundle. This carries no command-handling
 * semantics of its own; `Accepted` (useCases/command/shapes/Decision.ts) is
 * this plus a command-outcome discriminant. Kept separate so outbound
 * persistence capabilities can depend on the pairing without depending on
 * the command-handling layer's `Decision` union.
 */
export interface EventsAndIntents<TEvent extends DomainEvent, TIntent extends Intent = never> {
  readonly events: [TEvent, ...TEvent[]];
  readonly intents: TIntent[];
}
