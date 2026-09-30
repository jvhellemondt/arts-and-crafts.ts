# ADR-0013: Append Guards a Dynamic Consistency Boundary via Per-Concern Versions

**Date:** 2026-09-30
**Status:** Accepted
**Context:** v5 event store capabilities (`packages/v5`, `examples/v5`)

## Context

v5 has no aggregates. An event names the concerns (`StreamKey`s) it is about,
and a decision loads the events for every concern it needs, e.g. opening a
membership reads both `Membership#<id>` and `EmailRegistration#<email>`. That
set of concerns is the decision's dynamic consistency boundary.

`AppendToEventStore.append(events, expectedPosition?)` could not defend that
boundary. A single global position rejects every concurrent append anywhere in
the store, related or not. Leaving it out accepts lost updates: a second
writer can land on a concern between the load and the append, and the
decision is appended against state it never saw.

## Decision

- `DynamicConsistencyResult<TEvent>` (`adapters/outbound/shapes`) is what a
  load against a boundary returns: `{ events, versions }`, where `versions`
  holds, for every queried concern, the version it stood at when read (the
  number of events carrying it; `0` for a concern with none).
- `AppendToEventStore.append(events, versions)` takes that map back. The
  append only lands while **every** concern in it still stands at the version
  that was read, including concerns the new events do not write to.
  Otherwise nothing is written and the append fails with a
  `CONCURRENCY_CONFLICT` failure.
- `InMemoryEventStore` (`examples/v5`) implements both.
  `LoadDomainEvents<TEvent, ResultAsync<DynamicConsistencyResult<TEvent>, GatewayFailure>>`
  is what its `load()` returns, and its `append()` fails with
  `AppendFailure = GatewayFailure | CONCURRENCY_CONFLICT`. Its `versions`
  argument is optional, so a caller with no boundary to defend (today:
  `InMemoryTransactionalWriter`) can still append unconditionally.

## Rationale

- **Per-concern versions are exactly as coarse as the decision.** Two
  decisions conflict only when they read or write a shared concern; appends
  elsewhere in the store never cancel each other.
- **Guarding read-only concerns matters.** A decision that only reads a
  concern still depends on it. If that concern moves on, the decision is stale
  even though it writes elsewhere.
- **It maps onto real backends.** A DynamoDB store can condition its
  `TransactWriteItems` on each concern's latest version item. A Postgres
  store can compare per-concern counts or version columns inside the
  transaction. Either way, the in-memory store's semantics are what a real
  adapter has to reproduce.

## Consequences

### Positive

- The event store can refuse a decision taken against stale state, per
  concern, instead of all-or-nothing.
- `load` hands back everything `append` needs, so callers do not compute
  versions themselves.

### Negative

- Breaking change to `AppendToEventStore`: `expectedPosition` is gone, and
  `versions` is required at the capability level.
- `LoadDomainEvents` keeps its generic `TResult`, and its default is still
  `TEvent[]`. Implementations have to opt into `DynamicConsistencyResult`
  explicitly.
- `PersistDecision.persist()` does not carry versions yet, so the example's
  transactional writer appends without a guard. It restamps the (unreachable)
  conflict code as `GATEWAY_FAILURE` to keep `persist` answering in
  `GatewayFailure` alone. The command handlers therefore do not defend their
  boundary end-to-end yet.

## Alternatives Considered

- **A global expected position**: simple, but any unrelated concurrent append
  conflicts, so throughput drops as the store grows.
- **One version per stream (aggregate-style)**: v5 decisions span several
  concerns, so there is no single stream to version.
- **Guard only the concerns being written**: misses decisions that depend on a
  concern they only read.

## References

- `packages/v5/src/module/adapters/outbound/shapes/DynamicConsistencyResult.ts`
- `packages/v5/src/module/adapters/outbound/capabilities/AppendToEventStore.ts`
- `examples/v5/shared/adapters/outbound/EventStore.InMemory.ts`
- ADR-0010: Events and Intents Persist Atomically via a Transactional Writer
- ADR-0011: A Portable Datasource
