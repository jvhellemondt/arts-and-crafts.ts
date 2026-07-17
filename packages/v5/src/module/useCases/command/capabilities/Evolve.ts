import type { DomainEvent } from "../../../core/shapes/DomainEvent.ts";

export interface Evolve<TState, TEvent extends DomainEvent> {
  evolve(currentState: TState, event: TEvent): TState;
}
