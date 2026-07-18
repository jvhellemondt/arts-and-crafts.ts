# ADR-0004: Query and Projection Handling

**Date:** 2026-07-18
**Status:** Accepted
**Context:** v5 query use cases (`packages/v5/.../useCases/query`, `examples/v5`)

## Context

Reads must not replay the event log per request. We need read models built
asynchronously from events, a query path that stays trivial, and a defined way
to rebuild a projection when its shape changes.

## Decision

Separate the read model (a **projection**, maintained by a **projector**) from
the read request (a **query**, served by a `HandleQuery`).

- **Query is its payload.** A query carries no message envelope — no id,
  timestamp, or metadata. `HandleQuery<TQuery, TResult>.handle(query)` takes the
  criteria object directly, and the inbound adapter feeds it the parsed payload.
  The `Query`/`Message` envelope (id, timestamp, metadata) was removed as unused
  on the read path — a query is never persisted or published, so it needs none.
- **Projection** — a state plus a pure `apply(state, event): state` fold.
- **Projector** — `projector.tick()` is an idempotent, checkpoint-driven
  catch-up: `loadCheckpoint()` → `loadEventsFrom(checkpoint + 1, batch)` → for
  each stored event `apply` and `saveProjection`, then `advanceCheckpoint(pos)`.
  It uses the outbound ports `LoadProjection`, `SaveProjection`, `LoadCheckpoint`,
  `AdvanceCheckpoint`, and `LoadEventsFrom`, all `ResultAsync<…, GatewayFailure>`.
- **Rebuild** is resetting the checkpoint (and clearing the projection): the next
  ticks replay from position 0. No separate rebuild machinery.
- **Query handler** reads the current projection via `LoadProjection` and filters
  in memory; it never touches the event store.

## Rationale

- **The projector owns the write to the read model; the query only reads it.**
  This keeps the query path a filter over already-materialised state.
- **Checkpoints make ticks safe and resumable.** Each tick advances only after a
  successful apply+save, so re-running (a missed timer, a crash) re-applies from
  the last durable position without double counting.
- **A query is criteria, not a message.** Reads are not persisted or published,
  so the `Message` envelope earned nothing on the read side and was dropped.

## Consequences

- Reads are eventually consistent — a projection reflects a command only after
  the next tick (ADR-0002).
- A schema change is handled by a rebuild (checkpoint reset), at the cost of a
  replay window during which the projection is incomplete.
- Projections are use-case-shaped; multiple read models tail the same event store
  at independent checkpoints.

## References

- ADR-0002: Runtime and Shell Model
- ADR-0006: Domain and Integration Events, Event Relay, and Checkpoints
- ADR-0008: Outbound Ports Return ResultAsync
