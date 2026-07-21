# ADR-011: Events and Intents Persist Atomically via a Transactional Writer

**Date:** 2026-07-21
**Status:** Accepted
**Context:** v5 outbound adapters and command handlers (`packages/v5`, `examples/v5`)

## Context

ADR-0003 (`packages/v5/docs/adr/0003-intent-and-outbox-pattern.md`) established
that intents must survive process crashes via the outbox pattern, and states
the guarantee plainly: *"the outbox provides this guarantee by writing intents
durably in the same transaction as domain events."*

The example implementation did not deliver that guarantee. `OpenMembershipHandler`
persisted the two writes as independent calls, combined only for error
reporting:

```ts
ResultAsync.combineWithAllErrors([
  this.repository.store(decision.events),   // event store — one gateway
  this.outbox.stage(decision.intents),      // outbox — a different gateway
]).map(() => decision)
```

`combineWithAllErrors` aggregates failures from both calls into one array; it
does not make the calls atomic. `repository.store` and `outbox.stage` wrote to
two independently-faulting gateways, each with its own `SimulateFaults` flag.
A real failure mode followed directly from this: the event store write could
succeed while the outbox write failed (or vice versa), leaving the event
stream and the outbox permanently inconsistent — an event persisted with no
corresponding intent ever staged to notify about it, or an intent staged for
an event that was never actually appended. `GatewayFailure[]` correctly
reported *that* something failed, but nothing prevented the partial write from
having already happened.

Separately, `OpenMembershipHandler` never communicated a **rejected** decision
to anything beyond the synchronous HTTP response — `OpenMembershipRejected`
(a `Notification`, `rejections/MembershipAlreadyExists.ts`) existed as declared
type surface but was never constructed or staged anywhere.

## Decision

Four pieces, arrived at after two design iterations documented below:

**1. `EventsAndIntents`, a core shape.** The "events produced together with the
intents they imply" pairing, with no command-handling semantics of its own:

```ts
// packages/v5/src/module/core/shapes/EventsAndIntents.ts
export interface EventsAndIntents<TEvent extends DomainEvent, TIntent extends Intent = never> {
  readonly events: [TEvent, ...TEvent[]];
  readonly intents: TIntent[];
}
```

`Accepted<TEvent, TIntent>` (`useCases/command/shapes/Decision.ts`) is
`{ accepted: true } & EventsAndIntents<TEvent, TIntent>` — the command-outcome
discriminant plus this pairing, not a redefinition of it. `Rejected<TRejection>`
is untouched: `{ accepted: false; rejection: TRejection }`.

**2. `PersistEventsAndIntents`, a library capability** scoped specifically to
the accepted branch:

```ts
// packages/v5/src/module/adapters/outbound/capabilities/PersistEventsAndIntents.ts
export interface PersistEventsAndIntents<TDomainEvent extends DomainEvent, TIntent extends Intent, TReturn> {
  persist(payload: EventsAndIntents<TDomainEvent, TIntent>): TReturn;
}
```

Because `Accepted` structurally satisfies `EventsAndIntents`, a handler calls
`writer.persist(decision)` directly on the accepted branch — no manual
destructuring. This capability deliberately does **not** widen to accept the
whole `Decision` union (see Alternative 3) or `GatewayFailure` (out of scope,
see Alternative 4).

**3. `InMemoryDatasource`, a shared in-memory "database" with a connection-like
commit boundary** (`examples/v5/shared/adapters/outbound/InMemoryDatasource.ts`).
`InMemoryEventStore` and `InMemoryOutbox` are unchanged in shape — they still
just `append()`/`stage()` — but both now read from and write to the same
`InMemoryDatasource`, which starts in autocommit mode and exposes a
transaction boundary:

```ts
export class InMemoryDatasource {
  private readonly tables = new Map<TableName, unknown[]>();
  private readonly staged: { table: TableName; rows: unknown[] }[] = [];
  private mode: "autocommit" | "manual" = "autocommit";

  read<TRow>(table: TableName): TRow[] { /* always returns committed rows */ }

  write(table: TableName, rows: unknown[]): void {
    if (this.mode === "autocommit") { this.read(table).push(...rows); return; }
    this.staged.push({ table, rows });
  }

  begin(): void { this.mode = "manual"; }
  commit(): void { /* flush every staged write, then mode = "autocommit" */ }
  rollback(): void { /* discard every staged write, then mode = "autocommit" */ }
}
```

A write made with no transaction open commits immediately — exactly what a
standalone `InMemoryEventStore`/`InMemoryOutbox` (constructed with no
datasource, or a fresh one) needs, so every pre-existing standalone test is
unaffected. `InMemoryTransactionalWriter` is the one thing that opens a
transaction:

```ts
// examples/v5/shared/adapters/outbound/TransactionalWriter.InMemory.ts
export class InMemoryTransactionalWriter<TEvent extends DomainEvent, TIntent extends Intent, TNotification extends Notification = never>
  implements PersistEventsAndIntents<TEvent, TIntent, ResultAsync<void, GatewayFailure>>, SimulateFaults
{
  constructor(
    private readonly eventStore: InMemoryEventStore<TEvent>,
    private readonly outbox: InMemoryOutbox<TIntent, TNotification>,
    private readonly datasource: InMemoryDatasource,
  ) {}

  persist({ events, intents }: EventsAndIntents<TEvent, TIntent>): ResultAsync<void, GatewayFailure> {
    this.datasource.begin();
    return this.eventStore.append(events)
      .andThen(() => this.outbox.stage(intents))
      .map(() => this.datasource.commit())
      .mapErr((failure) => {
        this.datasource.rollback();
        return failure;
      });
  }
}
```

`eventStore`, `outbox`, and `datasource` are all constructed once at the
wiring layer and shared; the writer additionally holds the `datasource`
directly so it can open and close the transaction around its own call.

**4. The handler stages a rejection notification directly, outside any
transaction.** `OpenMembershipHandler` takes a second capability,
`StageNotifications<OpenMembershipRejected>`, alongside the writer:

```ts
handle(command: OpenMembershipCommand): ResultAsync<OpenMembershipDecision, GatewayFailure[]> {
  return this.repository
    .load(command.payload.membershipId, command.payload.email)
    .mapErr((failure): GatewayFailure[] => [failure])
    .map((state) => decideOpenMembership(state, command))
    .andThen((decision) =>
      decision.accepted
        ? this.writer.persist(decision).mapErr((f): GatewayFailure[] => [f]).map(() => decision)
        : this.notifications
            .stage([this.toRejectedNotification(command, decision.rejection)])
            .mapErr((f): GatewayFailure[] => [f])
            .map(() => decision),
    );
}
```

`toRejectedNotification` builds the `OpenMembershipRejected` envelope from the
**command** (`payload`, `id`, `metadata`, `type`) plus `decision.rejection` —
deliberately in the handler, not the writer (see Alternative 2). Because no
transaction is open for this call, `outbox.stage(...)` commits immediately —
the same outbox instance the accepted-path intents flow through, just used
outside `persist()`'s transaction boundary.

## Rationale

### Real staging and rollback, not a pre-flight guess

An early version of this design checked a combined `isSimulating` flag once
before either write, then fired both. That is observably safe for these two
adapters today, but only because their *sole* failure mode happens to be that
one flag — check it, and nothing else can go wrong. It is not staging-then-
committing; it is predicting failure in advance. If either store ever grew a
second failure mode not gated by that flag, an event could be appended and
then fail to get an intent for an unrelated reason, right back to the
inconsistency this ADR exists to close.

The datasource's transaction boundary fixes this properly: while a
transaction is open, `append()`/`stage()` genuinely only stage their writes
(invisible via `read()`), and `rollback()` discards whatever got staged if the
other write fails — regardless of *why* it failed. This is real
recoverability, the same property a database transaction gives two `INSERT`s
sharing one connection: not because the statements were merged into one, but
because they share a commit boundary that either flushes both or neither.

### Why the transaction boundary is dynamic, not a fixed construction-time mode

The first version of `InMemoryDatasource` took its mode (`"autocommit"` |
`"manual"`) as a constructor argument, fixed for the datasource's whole
lifetime. That broke the moment the handler needed to stage a rejection
notification directly on the *same* outbox instance the transactional writer
uses: if that shared datasource was constructed in `"manual"` mode (needed for
the writer's atomicity), a standalone `outbox.stage(...)` call outside
`persist()` would silently stage the notification and never commit it,
because nothing else was going to call `commit()` for that write. Splitting
into two separate datasources per use would have avoided that, but then the
intent relay would only ever see one of them — defeating the point of one
shared outbox that both paths feed. Making the mode a `begin()`/`commit()`/
`rollback()` transaction boundary that always returns to autocommit resolves
this the way a real connection does: nothing is "in a transaction" unless
something explicitly opened one, so a write made outside `persist()` commits
immediately, exactly as if the datasource had no transactional capability at
all.

### Why the commit boundary lives on the datasource, not on each store

A still-earlier attempt gave `InMemoryEventStore` and `InMemoryOutbox` their
own `prepareX`/`commitX` method pairs, so each could compute rows without
mutating anything and a caller could check both before committing either.
That worked, but it meant re-deriving the same prepare/commit split on every
store that ever needed to participate in an atomic write, and it changed both
stores' public APIs for a concern — transaction boundaries — that isn't
really theirs. Moving `begin()`/`commit()`/`rollback()` onto the shared
`InMemoryDatasource` means `InMemoryEventStore` and `InMemoryOutbox` keep the
exact interface they had before this ADR (`append`/`stage`, nothing added),
and any future store that wants to participate in an atomic write only needs
to read/write through the same datasource.

### Why `persist()` doesn't take the whole `Decision`

`Accepted` and `Rejected` are siblings under `Decision`, and it's tempting to
give the write capability one method that branches internally. That doesn't
work here: building `OpenMembershipRejected` needs `command.id`,
`command.metadata`, and `command.payload` — none of which exist on `Decision`
or `Rejected` at all. A generic `persist(decision)` on the writer would need
the writer to also know about the specific command shape and how to map a
rejection into that specific `Notification` type, pushing business/command-
specific wiring into what's supposed to be a reusable infra adapter. The
handler already has both the command and the decision in scope, and staging a
standalone notification has no atomicity concern to begin with — nothing else
needs to commit alongside it. Two different capabilities for two genuinely
different jobs.

### Effect on `GatewayFailure[]`

The handler's return type is still `ResultAsync<OpenMembershipDecision,
GatewayFailure[]>`, and the array still normalises every failure point into
one shape. Before this ADR, the array could hold up to two failures from one
`combineWithAllErrors` call, because two gateways could fail independently
within a single step. Now there are three failure points —
`repository.load`, `writer.persist`, and `notifications.stage` — each
producing at most one failure, wrapped individually via
`.mapErr((f) => [f])`. The array shape is preserved for consistency across
call sites, but it is no longer "intrinsic" to a multi-gateway combinator
(contra ADR-009's framing of the old design) — it is hand-wrapped, because
there is nothing left to combine at any single point.

Failures also keep their originating identity — `gateway:
"InMemoryEventStore"` or `gateway: "InMemoryIntentOutbox"`, whichever store
actually failed — rather than being flattened into one writer-level identity,
since `.append()`/`.stage()` keep returning their own `GatewayFailure`
unchanged through the chain.

## Consequences

### Positive

- Closes the gap between ADR-0003's stated guarantee and what the example
  actually did: an event is never persisted without its intent, or vice
  versa.
- A rejected decision is now actually observable outside the synchronous HTTP
  response — `OpenMembershipRejected` is constructed and staged, closing the
  gap between ADR-0003/ADR-0007's described rejection-notification pattern
  and what the example implemented (previously nothing).
- `InMemoryEventStore` and `InMemoryOutbox` are unchanged in shape — every
  existing standalone test needed zero changes, because autocommit is always
  the state a fresh or standalone-used datasource is in.
- The handler's write paths are one call each instead of a combinator over
  two, and impossible to accidentally reorder.

### Negative

- `PersistEventsAndIntents` only covers the events-and-intents-on-accept
  case; a decider that needs to persist events with no intents still uses
  the narrower `AppendToEventStore` directly.
- `InMemoryDatasource.read()` always returns committed rows, never staged
  ones — a store cannot see its own uncommitted writes within the same
  transaction. Irrelevant for the current use case (one `append()`, one
  `stage()`, one `commit()` per `persist()` call).
- `GatewayFailure` explicitly does not flow through this mechanism (see
  Alternative 4) — an infrastructure failure while staging a rejection
  notification is reported as `Err`, same as any other gateway failure, not
  routed to a notification of its own.
- Only `openMembership` was migrated. The other command use cases under
  `examples/v5/modules/membership/useCases/commands/` are unimplemented
  stubs with no repository or persistence of their own; they inherit this
  pattern automatically once built out, but nothing was retrofitted onto
  them.

### Confirmation

`pnpm run typecheck`, `pnpm run lint`, `pnpm run fmt:check`, and `pnpm run
coverage` (100% thresholds) all pass for `packages/v5` and `examples/v5`.

## Alternatives Considered

### Alternative 1: A generic `withTransaction` unit-of-work port

Add a transaction-boundary capability to the v5 library itself — e.g.
`withTransaction<T>(work: (tx) => ResultAsync<T, GatewayFailure>):
ResultAsync<T, GatewayFailure>` — that any adapter could participate in.

**Rejected for now because:** it generalises past what any current adapter
needs. The only two things that must ever be atomic together in this codebase
are an accepted decision's events and its intents — that is precisely what
the outbox pattern (ADR-0003) exists to guarantee. A narrower, purpose-built
capability (`PersistEventsAndIntents`) says exactly what it does; a generic
unit-of-work abstraction would need real design work (nesting, isolation,
adapter participation) with no second use case yet to validate it against.

### Alternative 2: `persist(command, decision)` builds the notification itself

Give the writer the command too, so one `persist()` call could handle both
branches, constructing `OpenMembershipRejected` internally on the rejected
path.

**Rejected because:** this makes the writer's generic infra adapter
responsible for knowing a specific command's payload shape and a specific
notification's construction — coupling meant to stay at the handler/use-case
level. It also doesn't reduce total code; it just moves the notification-
building logic into a class that's supposed to be reusable across future
modules. The handler already has everything needed with no extra
dependencies.

### Alternative 3: One capability taking the whole `Decision`

Have `PersistEventsAndIntents` (or a renamed equivalent) accept
`Decision<TEvent, TIntent, TRejection>` directly, branching internally
between atomic persist and notification staging.

**Rejected because:** see Alternative 2 — the rejected branch needs the
command, not just the decision, so this doesn't actually unify the two paths
without also folding the command in (Alternative 2, also rejected). It would
also reintroduce a dependency from `adapters/outbound/capabilities` onto
`useCases/command/shapes/Decision.ts` for no resulting simplification.

### Alternative 4: Fold `GatewayFailure` into the same notification mechanism

Route `GatewayFailure` through `StageNotifications` too, reusing
`Notification`'s existing `details: Failure | Rejection` union so all three
outcomes (accepted, rejected, failed) go through one uniform mechanism.

**Rejected because:** `Accepted`/`Rejected` are both *domain* outcomes — the
command was fully processed, one way or another. `GatewayFailure` means the
opposite: infrastructure was unavailable and the outcome couldn't even be
determined. Staging a "the infrastructure failed" notification through that
same infrastructure is circular — if the event store is down, the outbox
sharing its datasource is likely down too. This is closer to what ADR-0004's
Technical Event Pattern exists for (a separate observability path), not this
capability's job.

### Alternative 5: `prepareX`/`commitX` methods on each store

Give `InMemoryEventStore` and `InMemoryOutbox` their own prepare/commit method
pairs, so each computes its rows without mutating anything and the writer
checks both before committing either.

**Rejected because:** it works, but it puts a transaction-boundary concern
onto stores whose job is just reading and writing their own table, and means
reinventing the same pair on every store that should ever participate in an
atomic write. Moving `begin()`/`commit()`/`rollback()` onto the shared
`InMemoryDatasource` keeps `append()`/`stage()` as the only write API either
store has.

### Alternative 6: Fixed autocommit/manual mode set at datasource construction

Give `InMemoryDatasource` its mode as a constructor argument instead of a
`begin()`/`commit()`/`rollback()` transaction boundary.

**Rejected because:** a datasource constructed in `"manual"` mode up front
(needed for the transactional writer) silently breaks any write made against
it *outside* that writer's coordinated flow — exactly the rejection-
notification case this ADR needs to support on the same shared outbox. A
dynamic transaction boundary that always returns to autocommit after
`commit()`/`rollback()` supports both uses on one shared datasource without
the caller needing to know which mode it should have been constructed in.

### Alternative 7: Retrofit all six other command use cases in the same change

Build out `decide.ts`, `repository.ts`, and `handler.ts` for
`acceptTermsOfService`, `activateMembership`, `changeAddress`, `changeEmail`,
`closeMembership`, and `verifyEmail`, wiring atomic persistence into each.

**Rejected because:** those use cases are empty scaffolds today — no decide
logic, no repository, nothing to persist. Implementing them is a separate,
much larger effort than adding atomicity to existing persistence. They get
the same pattern automatically once someone builds them out, since
`PersistEventsAndIntents`/`StageNotifications` are now the library-level
capabilities for this.

## References

- ADR-0003: Intent and Outbox Pattern (`packages/v5/docs/adr/0003-intent-and-outbox-pattern.md`)
- ADR-0004: Technical Event Pattern (`packages/v5/docs/adr/0004-technical-event-pattern.md`)
- ADR-0007: Incoming Event Handling Pattern (`packages/v5/docs/adr/0007-incoming-event-handling-pattern.md`)
- ADR-009: Outbound Ports Return ResultAsync; Rejection Stays in the Ok Channel
- `packages/v5/src/module/core/shapes/EventsAndIntents.ts`
- `packages/v5/src/module/adapters/outbound/capabilities/PersistEventsAndIntents.ts`
- `examples/v5/shared/adapters/outbound/InMemoryDatasource.ts`
- `examples/v5/shared/adapters/outbound/TransactionalWriter.InMemory.ts`
- `examples/v5/modules/membership/useCases/commands/openMembership/handler.ts`
- `examples/v5/modules/membership/useCases/commands/openMembership/rejections/MembershipAlreadyExists.ts`
- [neverthrow](https://github.com/supermacro/neverthrow)
