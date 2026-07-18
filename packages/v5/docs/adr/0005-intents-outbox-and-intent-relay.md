# ADR-0005: Intents, Outbox, and Intent Relay

**Date:** 2026-07-18
**Status:** Accepted
**Context:** v5 policies and outbox (`packages/v5/.../useCases/policy`, `adapters/outbound`)

## Context

A command decision often implies follow-up side effects — send a verification
email, notify the caller of a rejection. Those must not run inside the pure
decider or block the command, and must survive a crash between "events stored"
and "side effect done."

## Decision

Model the follow-up as an **Intent**, stage it transactionally in an **outbox**,
and dispatch it later with a polling **relay**.

- **Intent** — a `Message` (`kind: "intent"`) the decider returns alongside its
  events. It states *what should happen next*, not *how*.
- **Outbox** — intents (and caller `Notification`s, ADR-0009) are staged as
  `OutboxEnvelope`s: immutable snapshots with `status: "pending" | "dispatched" |
  "failed"`, `attemptCount`, and timestamps. A status change produces a new
  envelope, never a mutation. The command handler stores events and stages the
  outbox entries together (ADR-0003).
- **Intent relay** — `RelayPendingIntents.relay()` polls pending envelopes and
  dispatches each to a **policy** — a `HandleIntent<TIntent>` registered by
  intent type (e.g. `NotifyUserToVerifyEmail.v1` → `NotifyUserToVerifyEmailHandler`)
  — then marks it `dispatched` or, on failure, `failed` with the error and an
  incremented `attemptCount` (`MarkIntentDispatched` / `MarkIntentFailed`).
- **Policies** are handlers, not deciders: they perform the I/O (call the email
  gateway) that the intent describes.

## Rationale

- **Atomic-with-events staging, at-least-once delivery.** Because the intent is
  written in the same step as the events, no accepted decision loses its
  follow-up; the relay retries `failed`/`pending` envelopes, so policies must be
  idempotent.
- **Immutable envelopes.** Snapshotting each transition keeps the outbox an
  append-only audit of every attempt rather than a mutable job row.
- **Type-routed dispatch.** A registry keyed by intent type keeps the relay
  generic and each policy focused on one intent.

## Consequences

- Delivery is at-least-once and asynchronous — callers observe effects after a
  relay tick (ADR-0002), and policies must tolerate redelivery.
- The relay is a distinct worker from the projector; both are checkpoint/poll
  loops but over different stores (outbox vs. event store).

## References

- ADR-0003: Command Handling
- ADR-0006: Domain and Integration Events, Event Relay, and Checkpoints
- ADR-0009: Outcome Taxonomy (caller `Notification` carries a `Rejection`/`Failure`)
