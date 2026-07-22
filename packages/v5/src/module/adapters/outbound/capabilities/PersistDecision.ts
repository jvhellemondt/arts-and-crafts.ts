import type { DomainEvent } from "../../../core/shapes/DomainEvent.ts";
import type { Intent } from "../../../core/shapes/Intent.ts";
import type { Rejection } from "../../../core/shapes/Rejection.ts";
import type { Command } from "../../../useCases/command/shapes/Command.ts";
import type { Decision } from "../../../useCases/command/shapes/Decision.ts";
import type { GatewayFailure } from "../shapes/GatewayFailure.ts";

/**
 * Persists the outcome of a decision as a single unit, given the command that
 * produced it:
 *
 * - **Accepted** — appends the events and stages the intents atomically. One
 *   fails, neither lands — the event stream and the outbox never drift out of
 *   sync (see `docs/adr/0010`).
 * - **Rejected** — stages a caller notification built from the command
 *   (`payload`/`id`/`metadata`/`type`) and the rejection. No atomicity
 *   partner needed; there's nothing else to commit alongside it.
 *
 * The command is required because a rejection notification's envelope can't
 * be built from `Decision` alone — `Rejected` carries only the rejection, not
 * the command's `id`/`metadata`/`payload`.
 */
export interface PersistDecision<
  TCommand extends Command,
  TDomainEvent extends DomainEvent,
  TIntent extends Intent,
  TRejection extends Rejection,
  TReturn = Promise<void | GatewayFailure>,
> {
  persist(decision: Decision<TDomainEvent, TIntent, TRejection>, command: TCommand): TReturn;
}
