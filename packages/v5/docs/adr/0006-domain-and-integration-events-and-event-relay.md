# ADR-0006: Domain and Integration Events, Event Relay, and Checkpoints

**Date:** 2026-07-18
**Status:** Accepted
**Context:** v5 event store and outbound relays (`packages/v5/adapters/outbound`, `examples/v5`)

## Context

Domain events are the source of truth and must stay internal, append-only, and
replayable. Other services need a stable, versioned contract — not the internal
event shape. Consumers (projectors, relays) must each track their own position.

## Decision

Distinguish the internal record from the published contract, and let consumers
tail the log at independent checkpoints.

- **Domain event** — `kind: "domain"`, carrying `concerns` (stream keys) that
  place it on one or more streams. It is written by the decider (ADR-0003) and
  never mutated.
- **Stored event** — the persisted wrapper: `StoredEvent` adds a monotonic
  `globalPosition`, `insertedAt`, and the hoisted `concerns`. The event store is
  an **append-only read model**: consumers pull ranges by global position
  (`LoadEventsFrom(from, batch)`), Kafka-style, rather than being pushed to.
- **Integration event** — `kind: "integration"`, a separately versioned `Message`
  that is the *public* contract. An **event relay** tails stored domain events
  and publishes integration events via `PublishIntegrationEvents`, translating
  internal → public shape.
- **Checkpoint** — each consumer records its position with `LoadCheckpoint` /
  `AdvanceCheckpoint`, advancing only after a batch is durably handled, so it
  resumes exactly where it left off.

## Rationale

- **Internal vs. published shapes evolve independently.** Refactoring a domain
  event must not break consumers; the integration event is the versioned seam,
  so the relay — not the domain — owns the mapping and its versioning.
- **Pull + checkpoints beat push.** An append-only, position-indexed store lets
  any number of projectors and relays consume at their own pace and replay from
  any point, with ordering guaranteed per the global position.
- **`concerns`/stream keys, not aggregates-as-rows.** Events are placed on
  streams by their concerns, so state reconstruction and projections select by
  stream key without an ORM.

## Consequences

- Consumers are eventually consistent and independently paced; a slow relay never
  blocks a projector or a command.
- Two seams to version: the internal event log and the public integration
  contract. The relay absorbs internal changes that don't affect the contract.
- Delivery to the broker is at-least-once; downstream consumers must dedupe.

## References

- ADR-0004: Query and Projection Handling (projectors tail the same store)
- ADR-0005: Intents, Outbox, and Intent Relay (sibling outbound worker)
- ADR-0008: Outbound Ports Return ResultAsync
