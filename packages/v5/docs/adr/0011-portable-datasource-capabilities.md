# ADR-0011: A Portable Datasource — `StageTableRows`, `LoadTableRows`, `CoordinateTransactions`

**Date:** 2026-07-23
**Status:** Accepted
**Context:** v5 outbound adapters (`packages/v5`, `examples/v5`)

## Context

ADR-0010 (`packages/v5/docs/adr/0010-events-and-intents-persist-atomically.md`)
gave the in-memory example real atomicity between an accepted decision's
events and intents, via `InMemoryDatasource` — a shared `table name -> rows[]`
store with a `begin()`/`commit()`/`rollback()` transaction boundary that
`InMemoryEventStore` and `InMemoryOutbox` both read from and write to.

That closed the atomicity gap, but only for the in-memory example.
`InMemoryEventStore`, `InMemoryOutbox`, and `InMemoryTransactionalWriter` are
all written directly against the concrete `InMemoryDatasource` class — its
constructor parameter is typed `InMemoryDatasource`, not an abstract port —
and its API (`read()`/`write()` are synchronous, `write()` cannot fail) is
only possible because it's backed by a plain `Map`. Real backends are now
planned (DynamoDB, possibly Postgres, depending on hosting). Neither could
implement that same synchronous, infallible API — a real `write()` has to be
`async` and has to be able to fail. Without a shared abstraction, adding a
real backend means writing an entirely new event store, outbox, and
transactional writer from scratch, with no reuse of the one thing that's
hardest to get right: coordinating an atomic write across two independent
stores.

DynamoDB specifically has no live, multi-request transaction — its only
atomic multi-item primitive is `TransactWriteItems`, which takes the entire
list of operations up front and submits them in one call (capped at 100
items / 4MB). That's incompatible with a "begin, write live against the
server, write again, commit" round-trip; every operation has to be
accumulated client-side first. Postgres, by contrast, supports a real live
transaction (`BEGIN; INSERT ...; INSERT ...; COMMIT;`).

Separately, a read-side gap already exists today: `handler.test.ts` reaches
directly into `InMemoryDatasource.read()` to assert a rejection notification
landed in the outbox table, because `InMemoryOutbox.loadPending()`
deliberately filters to `entry.kind === "intent"` — it can't see notification
rows at all. That assertion is tied to the concrete `InMemoryDatasource`
today; it has no equivalent once a handler is tested against a different
backend.

## Decision

Three new capabilities in `packages/v5/src/module/adapters/outbound/capabilities/`,
generic over their return type (`TReturn`) the same way every other
capability in the library is — no new dependency on `neverthrow`, consistent
with ADR-0008.

**1. `StageTableRows`** — queues rows for a table. The one primitive that
must be shared across stores for atomicity to be possible at all, regardless
of backend:

```ts
import type { GatewayFailure } from "../shapes/GatewayFailure.ts";

export interface StageTableRows<TTable extends string = string, TReturn = Promise<void | GatewayFailure>> {
  write(table: TTable, rows: unknown[]): TReturn;
}
```

**2. `LoadTableRows`** — reads every row committed to a table, bypassing any
store's own business-logic filtering:

```ts
import type { GatewayFailure } from "../shapes/GatewayFailure.ts";

export interface LoadTableRows<TTable extends string = string, TReturn = Promise<unknown[] | GatewayFailure>> {
  read(table: TTable): TReturn;
}
```

**3. `CoordinateTransactions`** — opens, commits, or rolls back the boundary
that makes `StageTableRows` writes atomic across stores:

```ts
import type { GatewayFailure } from "../shapes/GatewayFailure.ts";

export interface CoordinateTransactions<TReturn = Promise<void | GatewayFailure>> {
  begin(): TReturn;
  commit(): TReturn;
  rollback(): TReturn;
}
```

A concrete datasource implements all three intersected — e.g.
`InMemoryDatasource implements StageTableRows<TableName, ResultAsync<void, GatewayFailure>>, LoadTableRows<TableName, ResultAsync<unknown[], GatewayFailure>>, CoordinateTransactions<ResultAsync<void, GatewayFailure>>`
— the same composition style `InMemoryEventStore` already uses across its
four existing capabilities (`LoadDomainEvents`, `LoadEventsFrom`,
`AppendToEventStore`, `SimulateFaults`).

`TTable` stays generic so each concrete datasource pins it to its own
literal table-name union (`InMemoryDatasource`'s existing `TableName =
"event_store" | "event_tags" | "outbox"`); a Dynamo- or Postgres-backed
datasource would define its own.

## Rationale

### Why `write` (staging) must be shared, but each store's own reads don't

`InMemoryTransactionalWriter.persist()` never calls a shared `read()` today —
only `append()`/`stage()` (which internally call `write()`) and
`begin()`/`commit()`/`rollback()`. That's not an accident: reads have no
cross-store atomicity requirement (loading events doesn't need to coordinate
with loading pending intents), so there's nothing to abstract for
portability there. A `DynamoEventStore` would use `Query`/`GetItem` directly
against its own table; a `PostgresEventStore` would run its own `SELECT`.
Neither needs a shared, generic reading primitive to do its own job.

Writes are different, specifically because of DynamoDB's `TransactWriteItems`
shape: submitting the event store's write and the outbox's write as two
independent calls can never be atomic on Dynamo, no matter how each call is
written, because Dynamo's only atomicity primitive requires *all* operations
in one call. Something has to accumulate both stores' pending writes before
anything is submitted — `StageTableRows.write()` is that accumulation point,
mirroring exactly what `InMemoryDatasource.write()` already does today
(queues into `this.staged`, flushed together on `commit()`). Postgres could
instead use a live transaction and skip queuing entirely, but using the same
queue-then-flush shape for both backends keeps one consistent abstraction —
the port means the same thing everywhere, rather than "live transaction on
Postgres, batched submission on Dynamo" as two different mental models behind
one interface.

### Why `LoadTableRows` exists despite the above

This is not a business-shaped read — `LoadDomainEvents` already is that, for
the event store specifically (`load(concerns): TEvent[]`), and continues to
be what `OpenMembershipRepository` depends on. `LoadTableRows` is a lower,
more primitive layer: raw, untyped access to whatever's actually committed
to a table, independent of any store's own filtering. It exists because that
capability has no business-shaped equivalent anywhere — `LoadPendingIntents`
can't see notifications, and there is no `LoadAllOutboxEntries`. Handler-level
tests need to see raw state regardless of which concrete datasource is wired
up underneath, the same way `SimulateFaults` lets handler tests inject faults
regardless of backend — so this stays on the port rather than becoming a
one-off inspection method on `InMemoryDatasource` alone.

### Why no `neverthrow` dependency on `packages/v5`

All three interfaces follow the same `TReturn` convention already used by
`PersistDecision`, `LoadDomainEvents`, `AppendToEventStore`, etc. — generic,
defaulting to a plain `Promise`, never hardcoded to `ResultAsync`. `neverthrow`
stays confined to the packages that already depend on it (`v5-utils`,
`v5-hono`, `v5-aws`, `examples/v5`); a concrete datasource instantiates
`TReturn` as `ResultAsync<..., GatewayFailure>` itself, the same way
`InMemoryTransactionalWriter` already instantiates `PersistDecision`.

Methods on the interfaces are never declared `async`, for the same reason
`InMemoryEventStore.append()` isn't: `async function(): T` always wraps its
return in an extra `Promise`, which is wrong when `T` is already `ResultAsync`
(a thenable in its own right) — `async` would produce `Promise<ResultAsync<...>>`
instead of `ResultAsync<...>`. A concrete implementation returning a plain
`Promise<T>` (the default `TReturn`) could use `async` internally if it
needs to `await` something; the interface itself never does either way,
since interface members have no body.

### Naming

Capability names in this library read as "has the ability to X" — `Load`,
`Append`, `Stage`, `Mark`, `Persist`, `Save`, `Advance`, `Simulate` are the
established verbs; `Queue` and `Read` (an earlier draft's names for these
same two capabilities) aren't. `Stage` already means exactly this in the
library (`StageIntents`, `StageNotifications` — queued, not yet effective
until something else confirms it), and `Load` is already the verb for every
other read capability (`LoadDomainEvents`, `LoadPendingIntents`,
`LoadProjection`, `LoadCheckpoint`).

`Table` is the correct shared term across both planned backends — DynamoDB
calls its structure a table too (with items, not rows); "collection" is
MongoDB's term, not Dynamo's, and isn't relevant here. `Rows` is admittedly
the more SQL-flavored half of the pair (Dynamo calls its unit "an item"), but
it's already the established, backend-neutral term at this exact layer in
`InMemoryDatasource.ts`'s own doc comments ("table name -> rows[]", "each
store owns and casts to its own row shape") — kept for consistency rather
than introducing a third vocabulary.

`CoordinateTransactions` is plural for the same reason `SimulateFaults` is:
it describes a general, repeated ability (a fresh transaction opens and
closes on every `persist()` call) rather than a single tracked instance —
plural signals "the capability," not "the current one in progress."

## Consequences

### Positive

- The one thing that's genuinely hard to get right across backends —
  coordinating an atomic write across two independent stores — becomes
  shared and portable. A future `DynamoDatasource`/`PostgresDatasource` only
  needs to implement these three capabilities; `InMemoryTransactionalWriter`'s
  equivalent for that backend can be written against the port instead of a
  from-scratch reimplementation.
- Handler-level tests that need to see raw committed state (like
  `handler.test.ts`'s notification assertion) can do so via `LoadTableRows`
  regardless of which concrete datasource backs the handler under test.
- No new dependency added to `packages/v5` — `neverthrow` usage stays exactly
  where it already was.

### Negative

- This does **not** make `EventStore`/`Outbox` themselves backend-swappable
  with zero new code. Each store's own business-shaped capabilities
  (`LoadDomainEvents`, `AppendToEventStore`, `LoadPendingIntents`, ...) remain
  backend-specific — a `DynamoEventStore` is still a full, separate
  implementation. Only the write-queuing, transaction-lifecycle, and
  raw-table-read pieces are shared.
- `LoadTableRows` returns untyped `unknown[]`; callers cast to their own row
  shape. This is an accepted tradeoff, not a gap — `InMemoryDatasource.ts`
  already documents the same untyped-boundary philosophy for `write()`.
- No second backend implementation exists yet to validate this shape against.
  ADR-0010's Alternative 1 explicitly deferred a similar abstraction for lack
  of a second use case; this ADR takes the step now because concrete
  DynamoDB/Postgres plans exist, but the interfaces may still need revision
  once a real backend is actually built against them.

### Confirmation

The three interfaces exist in `packages/v5/src/module/adapters/outbound/capabilities/`
and `InMemoryDatasource` implements all three (`read`/`write` now return
`ResultAsync`, wrapping the same synchronous `Map` operations as before via
`okAsync`). `InMemoryEventStore`, `InMemoryOutbox`, and
`InMemoryTransactionalWriter` were rewritten to chain through the resulting
`ResultAsync`s (`.andThen()`/`.map()`/`.orElse()` instead of direct
synchronous property access); every existing test in `examples/v5` was
updated for the new async signatures and still passes unchanged in behavior.
`pnpm -r run typecheck`, `pnpm -r run lint`, `pnpm -r run fmt:check`, and
`pnpm run coverage` (100% thresholds) all pass for the whole workspace.

Still outstanding: no real backend (Dynamo or Postgres) implements these
interfaces yet, so the shape is validated against one concrete
implementation (`InMemoryDatasource`), not two — the main open risk this ADR
still carries.

## Alternatives Considered

### Alternative 1: One combined `Datasource` interface with all five methods

Keep `read`/`write`/`begin`/`commit`/`rollback` on a single interface instead
of splitting into three.

**Rejected because:** it doesn't match how the rest of the library composes
capabilities — every existing multi-capability adapter (`InMemoryEventStore`,
`InMemoryOutbox`) implements several single-purpose interfaces intersected,
not one interface bundling unrelated concerns. `LoadTableRows` in particular
has a different consumer (tests, incidentally) than `StageTableRows`/
`CoordinateTransactions` (production atomicity) — bundling them obscures
that only two of the three are actually required for the atomicity guarantee
this ADR exists to preserve.

### Alternative 2: Generic `read<TRow>(table): TReturn` matching the concrete class exactly

Keep `read` generic per call (as `InMemoryDatasource.read<TRow>()` already
is) instead of accepting untyped `unknown[]` through the port.

**Rejected because:** TypeScript can't express a `TReturn` type parameter
that varies based on a generic that only exists on the method call — there's
no higher-kinded-type support to make an interface-level `TReturn` "wrap
whatever `TRow` turns out to be." `LoadDomainEvents` sidesteps this by
hoisting its event type to the interface level, but that only works because
each `LoadDomainEvents` instance deals with one event type; `LoadTableRows`
deliberately doesn't, since one shared datasource backs multiple stores' rows
of different shapes. Accepting `unknown[]` and letting callers cast is
consistent with `InMemoryDatasource.ts`'s own existing "intentionally
untyped at this shared boundary" philosophy.

### Alternative 3: Live transactions only (no staging), matching Postgres

Model `CoordinateTransactions` around a real live transaction — writes go
straight to the backend inside `begin()`/`commit()`, no client-side queuing —
since that's what Postgres naturally supports.

**Rejected because:** it doesn't work for DynamoDB, whose only atomic
multi-item primitive (`TransactWriteItems`) requires every operation to be
assembled and submitted together in one call — there's no live,
multi-request transaction to write into incrementally. Modeling the port
around staged writes (`StageTableRows.write()` queues, `commit()` flushes
everything as one operation) works for both: trivially for Dynamo, and just
as correctly for Postgres, which can flush its queue inside one real `BEGIN`/
`COMMIT` at `commit()` time.

## References

- ADR-0008: Outbound Ports Return ResultAsync; Rejection Stays in the Ok
  Channel
- ADR-0010: Events and Intents Persist Atomically via a Transactional Writer
- `examples/v5/shared/adapters/outbound/InMemoryDatasource.ts`
- `packages/v5/src/module/adapters/outbound/capabilities/PersistDecision.ts`
- `packages/v5/src/module/adapters/outbound/capabilities/LoadDomainEvents.ts`
- `packages/v5/src/module/adapters/outbound/capabilities/SimulateFaults.ts`
- [neverthrow](https://github.com/supermacro/neverthrow)
- [AWS DynamoDB `TransactWriteItems`](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html)
