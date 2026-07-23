# ADR-0010: Events and Intents Persist Atomically via a Transactional Writer

**Date:** 2026-07-21
**Status:** Accepted
**Context:** v5 outbound adapters and command handlers (`packages/v5`, `examples/v5`)

> **Revised 2026-07-23.** PR review on the original change (below) led to a
> further design iteration: `persist()` now takes the whole `Decision` *and*
> the command, covering both the accepted and rejected branches through one
> capability instead of two. This revision updates Decision/Rationale to
> describe the shape that actually shipped; "Alternatives Considered" notes
> which alternatives were originally rejected and later adopted on
> reconsideration, rather than pretending the first attempt was final. See
> also ADR-0011, which further generalised the shared datasource this ADR
> introduced into portable capabilities (`StageTableRows`, `LoadTableRows`,
> `CoordinateTransactions`).

## Context

ADR-0005 (`packages/v5/docs/adr/0005-intents-outbox-and-intent-relay.md`)
established that intents must survive process crashes via the outbox pattern:
*"the intent is written in the same step as the events, [so] no accepted
decision loses its follow-up."*

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

Four pieces, arrived at after two rounds of design iteration — the first
shipped and reviewed, the second (2026-07-23) responding to that review:

**1. `PersistDecision`, a library capability covering both branches of
`Decision`.**

```ts
// packages/v5/src/module/adapters/outbound/capabilities/PersistDecision.ts
export interface PersistDecision<
  TCommand extends Command,
  TDomainEvent extends DomainEvent,
  TIntent extends Intent,
  TRejection extends Rejection,
  TReturn = Promise<void | GatewayFailure>,
> {
  persist(decision: Decision<TDomainEvent, TIntent, TRejection>, command: TCommand): TReturn;
}
```

One capability, one call, covering both an accepted decision (events + intents
land atomically) and a rejected one (a caller notification is staged) — the
handler no longer branches on `decision.accepted` at all; the writer does,
internally. `Accepted<TEvent, TIntent>` (`useCases/command/shapes/Decision.ts`)
carries `events`/`intents` as its own inline fields — no separate
`EventsAndIntents` core shape composed in (that shape existed briefly in the
first iteration and was deleted; see Alternative 8).

**2. `InMemoryDatasource`, a shared in-memory "database" with a
connection-like commit boundary** (`examples/v5/shared/adapters/outbound/InMemoryDatasource.ts`).
`InMemoryEventStore` and `InMemoryOutbox` are unchanged in shape — they still
just `append()`/`stage()` — but both now read from and write to the same
`InMemoryDatasource`, which starts in autocommit mode and exposes a
transaction boundary (`begin()`/`commit()`/`rollback()`, mode `"autocommit"` |
`"atomic"` — see Alternative 9 for the earlier `"manual"` naming). As of
ADR-0011, the datasource implements three portable library capabilities
(`StageTableRows`, `LoadTableRows`, `CoordinateTransactions`) instead of
bespoke methods with no shared interface; see that ADR for the full design
and why `read()`/`write()` return `ResultAsync` even though nothing in the
in-memory implementation can actually fail.

A write made with no transaction open commits immediately — exactly what a
standalone `InMemoryEventStore`/`InMemoryOutbox` (constructed with no
datasource, or a fresh one) needs, so every pre-existing standalone test is
unaffected.

**3. `InMemoryTransactionalWriter.persist()` branches on `decision.accepted`
internally:**

```ts
// examples/v5/shared/adapters/outbound/TransactionalWriter.InMemory.ts
persist(
  decision: Decision<TEvent, TIntent, TRejection>,
  command: TCommand,
): ResultAsync<void, GatewayFailure> {
  if (!decision.accepted) {
    const notification = toRejectionNotification<TNotification>(command, decision.rejection);
    return this.outbox.stage([notification]);
  }

  return this.datasource.begin().andThen(() =>
    this.eventStore
      .append(decision.events)
      .andThen(() => this.outbox.stage(decision.intents))
      .andThen(() => this.datasource.commit())
      .orElse((failure) => this.datasource.rollback().andThen(() => errAsync(failure))),
  );
}
```

`eventStore`, `outbox`, and `datasource` are all constructed once at the
wiring layer and shared; the writer additionally holds the `datasource`
directly so it can open and close the transaction around its own accepted-path
call. The rejected branch stages a notification with no transaction — nothing
else needs to commit alongside a standalone notification.

**4. `toRejectionNotification` is a shared helper in `@arts-and-crafts/v5-utils`,
not handler- or writer-specific code:**

```ts
// packages/v5-utils/src/module/adapters/outbound/toRejectionNotification.ts
export function toRejectionNotification<TNotification extends Notification>(
  command: Command,
  rejection: Rejection,
): TNotification {
  return {
    kind: "notification",
    type: `${command.type}Rejected`,
    payload: command.payload,
    id: uuidv7(),
    timestamp: Date.now(),
    metadata: command.metadata,
    commandType: command.type,
    commandId: command.id,
    details: rejection,
  } as unknown as TNotification;
}
```

Every field is derived mechanically from `command` and `rejection` — including
`type`, via the `${command.type}Rejected` convention every existing rejection
notification already follows (`OpenMembership` → `OpenMembershipRejected`).
Nothing adapter- or command-specific is left, so this lives in `v5-utils`
rather than being reimplemented per writer (see Alternative 2).

`OpenMembershipHandler` is now a single unconditional chain, with the writer
as its only persistence dependency:

```ts
handle(command: OpenMembershipCommand): ResultAsync<OpenMembershipDecision, GatewayFailure> {
  return this.repository
    .load(command.payload.membershipId, command.payload.email)
    .map((state) => decideOpenMembership(state, command))
    .andThen((decision) => this.writer.persist(decision, command).map(() => decision));
}
```

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
`"atomic"`) as a constructor argument, fixed for the datasource's whole
lifetime. That broke the moment the handler needed to stage a rejection
notification directly on the *same* outbox instance the transactional writer
uses: if that shared datasource was constructed in the transactional mode
(needed for the writer's atomicity), a standalone `outbox.stage(...)` call
outside `persist()` would silently stage the notification and never commit
it, because nothing else was going to call `commit()` for that write.
Splitting into two separate datasources per use would have avoided that, but
then the intent relay would only ever see one of them — defeating the point
of one shared outbox that both paths feed. Making the mode a
`begin()`/`commit()`/`rollback()` transaction boundary that always returns to
autocommit resolves this the way a real connection does: nothing is "in a
transaction" unless something explicitly opened one, so a write made outside
`persist()` commits immediately, exactly as if the datasource had no
transactional capability at all.

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

### Why `persist()` takes the whole `Decision` and the command

The design that first shipped kept `persist()` scoped to the accepted branch
only, reasoning that building `OpenMembershipRejected` needs `command.id`,
`command.metadata`, and `command.payload` — none of which exist on `Decision`
or `Rejected` alone — and that folding the command into the writer would push
business/command-specific wiring into a supposedly-reusable infra adapter
(see Alternative 2's original rejection).

That objection didn't survive scrutiny. Building the notification needs
exactly one thing that isn't mechanically derivable from `command` and
`rejection`: the literal `type` string. And that turned out to be derivable
too, once the `${command.type}Rejected` convention was recognised as something
every existing rejection notification already follows, not something specific
to `OpenMembership`. With every field derivable, there was nothing left that
made the writer "business-specific" — `toRejectionNotification` ends up
exactly as generic as `append`/`stage` already are, just operating on
`command` + `rejection` instead of `events`/`intents`. Once that held, keeping
two separate capabilities on the handler (`PersistDecision` for the accepted
branch, `StageNotifications` for the rejected one) was pure duplication: the
handler doesn't need to know which branch it's on at all, since `persist()`
now does that internally.

### Effect on `GatewayFailure`

As all three failure points — `repository.load`, and (now, singular)
`writer.persist` — are called sequentially, never combined via a multi-gateway
combinator, `GatewayFailure` is a single value everywhere, not an array. The
handler's return type is `ResultAsync<OpenMembershipDecision, GatewayFailure>`,
matching `repository.load`'s and `writer.persist`'s own shapes exactly — no
`.mapErr((f) => [f])` wrapping needed anywhere. This corrects the first
iteration's `GatewayFailure[]`, which existed to give multiple failure points
one consistent shape when there were three call sites on the handler
(`repository.load`, `writer.persist`, `notifications.stage`); collapsing the
rejected branch into `writer.persist` left only two call sites, each already
returning one `GatewayFailure`, so the array added nothing.

Failures keep their originating identity — `gateway: "InMemoryEventStore"` or
`gateway: "InMemoryIntentOutbox"`, whichever store actually failed — rather
than being flattened into one writer-level identity, since `.append()`/
`.stage()` keep returning their own `GatewayFailure` unchanged through the
chain.

## Consequences

### Positive

- Closes the gap between ADR-0005's stated guarantee and what the example
  actually did: an event is never persisted without its intent, or vice
  versa.
- A rejected decision is now actually observable outside the synchronous HTTP
  response — `OpenMembershipRejected` is constructed and staged, closing the
  gap between ADR-0005's described caller-`Notification` pattern and what the
  example implemented (previously nothing).
- `InMemoryEventStore` and `InMemoryOutbox` are unchanged in shape — every
  existing standalone test needed zero changes, because autocommit is always
  the state a fresh or standalone-used datasource is in.
- The handler is a single unconditional chain, not a ternary on
  `decision.accepted` — one persistence dependency (`writer`), not two.
- `PersistDecision` now exactly matches what any future writer implementation
  needs to satisfy: one `persist(decision, command)` call handles both
  outcomes, so a Dynamo- or Postgres-backed writer (see ADR-0011) has one
  capability to implement, not two.

### Negative

- `InMemoryDatasource.read()` always returns committed rows, never staged
  ones — a store cannot see its own uncommitted writes within the same
  transaction. Irrelevant for the current use case (one `append()`, one
  `stage()`, one `commit()` per `persist()` call).
- The rejection notification's `type` is derived from `command.type` at
  runtime (string concatenation) rather than being explicit, checkable
  type-level information — a typo in a command's `type` string would silently
  produce a mismatched notification type with no compiler error.
- Only `openMembership` was migrated. The other command use cases under
  `examples/v5/modules/membership/useCases/commands/` are unimplemented
  stubs with no repository or persistence of their own; they inherit this
  pattern automatically once built out, but nothing was retrofitted onto
  them.

### Confirmation

`pnpm -r run typecheck`, `pnpm -r run lint`, `pnpm -r run fmt:check`, and
`pnpm run coverage` (100% thresholds) all pass for the whole workspace.

## Alternatives Considered

### Alternative 1: A generic `withTransaction` unit-of-work port

Add a transaction-boundary capability to the v5 library itself — e.g.
`withTransaction<T>(work: (tx) => ResultAsync<T, GatewayFailure>):
ResultAsync<T, GatewayFailure>` — that any adapter could participate in.

**Rejected because:** it generalises past what any current adapter needs. A
narrower, purpose-built capability (`PersistDecision`) says exactly what it
does; a generic unit-of-work abstraction would need real design work
(nesting, isolation, adapter participation) with no second use case yet to
validate it against. (ADR-0011 later took a narrower version of this step —
`StageTableRows`/`CoordinateTransactions` — once concrete DynamoDB/Postgres
plans existed to validate the shape against.)

### Alternative 2: `persist(command, decision)` builds the notification itself

Give the writer the command too, so one `persist()` call could handle both
branches, constructing `OpenMembershipRejected` internally on the rejected
path.

**Originally rejected, later adopted.** The first version of this ADR
rejected this, reasoning it made the writer's generic infra adapter
responsible for knowing a specific command's payload shape and a specific
notification's construction — coupling meant to stay at the handler/use-case
level. On reconsideration (2026-07-23 revision, see "Why `persist()` takes
the whole `Decision` and the command" above), that coupling turned out not to
exist: every field the notification needs is mechanically derivable from
`command` and `rejection`, including `type` via the `${command.type}Rejected`
convention. This is the design that shipped.

### Alternative 3: One capability taking the whole `Decision`

Have `PersistEventsAndIntents` (or a renamed equivalent) accept
`Decision<TEvent, TIntent, TRejection>` directly, branching internally
between atomic persist and notification staging.

**Originally rejected, later adopted.** The first version of this ADR
rejected this on the grounds that the rejected branch needs the command, not
just the decision — but see Alternative 2: once the command is folded in too,
this is exactly `PersistDecision`'s final shape (`persist(decision, command)`,
branching internally on `decision.accepted`). The "dependency from
`adapters/outbound/capabilities` onto `useCases/command/shapes/Decision.ts`"
objection was accepted as a reasonable, deliberate one-directional dependency
rather than a blocker — see ADR-0001 for the FCIS layering this touches.

### Alternative 4: Fold `GatewayFailure` into the same notification mechanism

Route `GatewayFailure` through `StageNotifications` too, reusing
`Notification`'s existing `details: Failure | Rejection` union so all three
outcomes (accepted, rejected, failed) go through one uniform mechanism.

**Rejected because:** `Accepted`/`Rejected` are both *domain* outcomes — the
command was fully processed, one way or another. `GatewayFailure` means the
opposite: infrastructure was unavailable and the outcome couldn't even be
determined. Staging a "the infrastructure failed" notification through that
same infrastructure is circular — if the event store is down, the outbox
sharing its datasource is likely down too. Infrastructure-failure
observability belongs to a separate path (structured logs, metrics, a dead-
letter mechanism) — not this capability's job.

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

**Rejected because:** a datasource constructed in the transactional mode up
front (needed for the transactional writer) silently breaks any write made
against it *outside* that writer's coordinated flow — exactly the rejection-
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
`PersistDecision` is now the library-level capability for this.

### Alternative 8: `EventsAndIntents`, a standalone core shape

Give `Accepted<TEvent, TIntent>` its shape by composition —
`{ accepted: true } & EventsAndIntents<TEvent, TIntent>` — with
`EventsAndIntents` living as a domain-agnostic core shape
(`packages/v5/src/module/core/shapes/EventsAndIntents.ts`) that
`PersistEventsAndIntents` (the capability that preceded `PersistDecision`)
depended on instead of `Decision` directly.

**Rejected on reconsideration.** Once `PersistDecision` took the whole
`Decision` (Alternative 3, adopted), there was no longer a narrower
accepted-only payload shape for a separate core type to describe —
`Accepted<TEvent, TIntent>` carries `events`/`intents` as its own fields
directly. The core shape and its file were deleted.

### Alternative 9: `"manual"` as the transaction mode's name

Name the non-autocommit `InMemoryDatasource` mode `"manual"` (as opposed to
`"autocommit"`).

**Rejected on reconsideration.** `"manual"` describes how the mode is
entered (an explicit `begin()` call), not what it does. `"atomic"` names the
guarantee the mode exists to provide — every write staged during it either
all lands or none does — which is the property call sites actually care
about.

## References

- ADR-0001: Modular Functional-Core / Imperative-Shell Folder Structure
- ADR-0003: Command Handling — Pure Decider, Specifications, and Decision
- ADR-0005: Intents, Outbox, and Intent Relay
- ADR-0008: Outbound Ports Return ResultAsync; Rejection Stays in the Ok Channel
- ADR-0009: Outcome Taxonomy — Rejection / Failure / Invalid Share an Outcome Base
- ADR-0011: A Portable Datasource — `StageTableRows`, `LoadTableRows`, `CoordinateTransactions`
- `packages/v5/src/module/useCases/command/shapes/Decision.ts`
- `packages/v5/src/module/adapters/outbound/capabilities/PersistDecision.ts`
- `packages/v5-utils/src/module/adapters/outbound/toRejectionNotification.ts`
- `examples/v5/shared/adapters/outbound/InMemoryDatasource.ts`
- `examples/v5/shared/adapters/outbound/TransactionalWriter.InMemory.ts`
- `examples/v5/modules/membership/useCases/commands/openMembership/handler.ts`
- `examples/v5/modules/membership/useCases/commands/openMembership/rejections/MembershipAlreadyExists.ts`
- [neverthrow](https://github.com/supermacro/neverthrow)
