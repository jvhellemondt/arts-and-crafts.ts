# ADR-0003: Command Handling — Pure Decider, Specifications, and Decision

**Date:** 2026-07-18
**Status:** Accepted
**Context:** v5 command use cases (`packages/v5/.../useCases/command`, `examples/v5`)

## Context

Commands are how state changes. We need one consistent flow from inbound adapter
to persisted events that keeps the decision logic pure, makes business rules
explicit and testable, and distinguishes "the domain said no" from "the
infrastructure broke."

## Decision

A command is handled as **load → decide → persist**, with a pure decider at the
centre.

- **Decider** — `decide(command, state): Decision` is a pure function
  (`Decide<TCommand, TState, TEvent, TIntent, TRejection>`). It reads state and
  the command and returns a `Decision`, with no I/O.
- **Specifications** — each business rule is an `EvaluateCandidate<T>` with a
  single `isSatisfiedBy(candidate): boolean`, named and unit-testable on its own
  (e.g. `MembershipDoesNotAlreadyExist`), and composed inside the decider.
- **Decision** — a discriminated result, in the **Ok** channel:
  `{ accepted: true; events; intents }` or `{ accepted: false; rejection }`.
  The `rejection` is a `Rejection` outcome (ADR-0009); its `code`/`reason` are
  typed domain values, not strings assembled at the edge.
- **Handler** — the imperative shell for one use case. It loads decision state
  via `LoadDecisionState.load(id, …)`, calls `decide`, and on `accepted` stores
  the events and stages the intents, combining outbound calls with
  `ResultAsync.combineWithAllErrors`. Its type is
  `ResultAsync<Decision, GatewayFailure[]>` — an accepted *or* rejected decision
  is a success value; only infrastructure faults are `Err` (ADR-0008).
- **Injection** — the handler is constructed from its outbound dependencies
  (event store, outbox); the inbound adapter builds it and passes them in.

## Rationale

- **Purity where the rules live.** A pure decider composing pure specifications
  needs no mocks to test, and business rules are reusable predicates rather than
  conditionals buried in a handler.
- **Rejection is an outcome, not an error.** Keeping the `Decision` in the Ok
  channel lets the inbound adapter map `accepted` → 202 and `rejection` → 409,
  reserving `Err` for `GatewayFailure` → 503 (ADR-0008, ADR-0009).
- **The handler orchestrates, it does not decide.** No business `if` lives in the
  handler; it only sequences load, decide, and the outbound writes.

## Consequences

- State is reconstructed per command (via the decision-state port / `Evolve`);
  long histories may warrant snapshots later.
- Every use case repeats the same load→decide→persist skeleton — uniform, if
  verbose.
- Informing a caller of a rejection asynchronously is a separate concern: a
  `Notification` staged in the outbox (ADR-0005), not the decider's job.

## References

- ADR-0008: Outbound Ports Return ResultAsync; Rejection Stays in the Ok Channel
- ADR-0009: Outcome Taxonomy — Rejection / Failure / Invalid
- ADR-0005: Intents, Outbox, and Intent Relay
