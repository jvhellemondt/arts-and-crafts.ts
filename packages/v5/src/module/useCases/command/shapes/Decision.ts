import type { DomainEvent } from "../../../core/shapes/DomainEvent.ts";
import type { Intent } from "../../../core/shapes/Intent.ts";
import type { Rejection } from "../../../core/shapes/Rejection.ts";

/**
 * Represents a successful decision made by a decider.
 *
 * An accepted decision is the result of a command passing all business rules.
 * It carries one or more domain events to be appended to the event stream,
 * and zero or more intents to be staged in the outbox.
 *
 * An accepted decision does NOT mean the command has been fully processed —
 * it means the domain has decided what should happen. Infrastructure concerns
 * (persisting events, dispatching intents) are handled by the use case handler.
 */
export type Accepted<TEvent extends DomainEvent, TIntent extends Intent = never> = {
  readonly accepted: true;
  readonly events: [TEvent, ...TEvent[]];
  readonly intents: TIntent[];
};

/**
 * Represents a rejection decision made by a decider.
 *
 * A rejection is a first-class business outcome — not an exception or an error.
 * It means the command was valid and understood, but one or more business rules
 * prevented it from being accepted. The domain explicitly said no.
 *
 * Rejections are never appended to the event stream. They may be recorded in
 * an audit log by the use case handler, and can be published as an integration
 * event if other bounded contexts need to know the command did not get through.
 */
export type Rejected<TRejection extends Rejection> = {
  readonly accepted: false;
  readonly rejection: TRejection;
};

/**
 * The return type of a decider's decide() function.
 *
 * A Decision is a discriminated union on `accepted`, enabling exhaustive
 * pattern matching at the use case handler and adapter level.
 *
 * Both `Accepted` and `Rejected` are expected business outcomes and are
 * returned as `Ok` from the use case. Only infrastructure failures such as
 * a unavailable event store are modelled as `Err` via `GatewayFailure`.
 *
 * @example
 * // Use case handler
 * const decision = decider.decide(command, state);
 *
 * if (!decision.accepted) {
 *   await auditLog.record(command, decision.rejection);
 * }
 *
 * return okAsync(decision);
 *
 * @example
 * // Adapter
 * const result = await useCase.execute(command);
 *
 * result.match(
 *   (decision) => {
 *     if (!decision.accepted) {
 *       const status = rejectionCodeToStatus[decision.rejection.code];
 *       return reply.status(status).send({ error: decision.rejection.reason });
 *     }
 *     return reply.status(200).send({ events: decision.events });
 *   },
 *   (error) => reply.status(503).send({ error: 'Service unavailable' }) // GatewayFailure
 * );
 */
export type Decision<
  TEvent extends DomainEvent,
  TIntent extends Intent = never,
  TRejection extends Rejection = Rejection,
> = Accepted<TEvent, TIntent> | Rejected<TRejection>;
