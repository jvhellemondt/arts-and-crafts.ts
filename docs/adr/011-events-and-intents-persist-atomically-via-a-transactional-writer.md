# ADR-011: Events and Intents Persist Atomically via a Transactional Writer

**Date:** 2026-07-19
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
does not make the calls atomic. `repository.store` and `outbox.stage` were two
calls to two independently-faulting gateways, each with its own
`SimulateFaults` flag. A real failure mode followed directly from this: the
event store write could succeed while the outbox write failed (or vice versa),
leaving the event stream and the outbox permanently inconsistent — an event
persisted with no corresponding intent ever staged to notify about it, or an
intent staged for an event that was never actually appended. `GatewayFailure[]`
correctly reported *that* something failed, but nothing prevented the partial
write from having already happened.

## Decision

Introduce `AppendEventsAndIntents`, a library capability that persists an
accepted decision's events and intents as one atomic unit, and back it in the
example with `InMemoryTransactionalWriter` — an adapter that composes the
event store and the outbox behind a single failure domain.

```ts
// packages/v5/src/module/adapters/outbound/capabilities/AppendEventsAndIntents.ts
export interface AppendEventsAndIntents<TDomainEvent extends DomainEvent, TIntent extends Intent, TReturn> {
  persist(events: TDomainEvent[], intents: TIntent[]): TReturn;
}
```

```ts
// examples/v5/shared/adapters/outbound/TransactionalWriter.InMemory.ts
export class InMemoryTransactionalWriter<TEvent extends DomainEvent, TIntent extends Intent>
  implements AppendEventsAndIntents<TEvent, TIntent, ResultAsync<void, GatewayFailure>>, SimulateFaults
{
  constructor(
    private readonly eventStore: InMemoryEventStore<TEvent>,
    private readonly outbox: InMemoryOutbox<TIntent, never>,
  ) {}

  get isSimulating(): boolean {
    return this.eventStore.isSimulating || this.outbox.isSimulating;
  }

  persist(events: TEvent[], intents: TIntent[]) {
    if (this.isSimulating) return errAsync(this.offlineFailure());
    return this.eventStore.append(events).andThen(() => this.outbox.stage(intents));
  }
}
```

`OpenMembershipHandler` now depends on `AppendEventsAndIntents` instead of a
bare `StageIntents` outbox, and calls it once on the accepted branch instead of
combining two independent writes:

```ts
decision.accepted
  ? this.writer
      .persist(decision.events, decision.intents)
      .mapErr((failure): GatewayFailure[] => [failure])
      .map(() => decision)
  : okAsync(decision)
```

`OpenMembershipRepository` no longer implements `StoreDomainEvents` — writing
back an accepted decision's events is not a read-side repository concern once
persistence is atomic with the intents; `repository` now only loads state.

## Rationale

### One failure domain, not two combined ones

The fix is not really about the write becoming "one call" — a single
synchronous method with no `await` between its two internal pushes was already
atomic in the sense that nothing else could interleave. The actual defect was
that `eventStore` and `outbox` could fail *independently*: one gateway down
while the other stayed up. `InMemoryTransactionalWriter.isSimulating` collapses
that to one gate — `eventStore.isSimulating || outbox.isSimulating` — checked
once, before either write. Either both writes proceed, or neither does. This
mirrors what makes a real database transaction atomic: two `INSERT`s over the
same connection either both commit or both roll back, because they share one
failure domain (the connection), not because the two `INSERT` statements were
merged into one.

### The repository loses a capability it no longer owns

Before this change, `OpenMembershipRepository` implemented both
`LoadDecisionState` and `StoreDomainEvents`, and the handler called
`repository.store(...)` and `outbox.stage(...)` as two separate steps it was
responsible for sequencing correctly. Now that sequencing (and its atomicity)
is the writer's job, leaving `store()` on the repository would be dead code
with a misleading implication — that calling it alone is a safe, complete
operation. It is not: an event stored without its intent is exactly the
inconsistency this ADR closes.

### Effect on `GatewayFailure[]`

The handler's return type is still `ResultAsync<OpenMembershipDecision,
GatewayFailure[]>`, and the array is still used to normalise both failure
points into one shape. But its origin changed. Before, the array could hold up
to two failures from one `combineWithAllErrors` call, because two gateways
could fail independently within a single step. Now, `combineWithAllErrors` is
gone — each of the two failure points (`repository.load`, `writer.
persist`) can produce at most one failure, and each is wrapped
individually via `.mapErr((f) => [f])`. The array shape is preserved for
consistency across call sites, but it is no longer "intrinsic" to a
multi-gateway combinator (contra ADR-009's framing of the old design) — it is
hand-wrapped, because there is nothing left to combine.

## Consequences

### Positive

- Closes the gap between ADR-0003's stated guarantee and what the example
  actually did: an event is never persisted without its intent, or vice versa.
- `InMemoryTransactionalWriter.simulate("offline")` takes down both underlying
  stores together, modelling one physical database going offline rather than
  two independently-faulting services.
- The handler's write path is one call instead of a combinator over two,
  which is simpler to read and impossible to accidentally reorder.

### Negative

- `AppendEventsAndIntents` only covers the events-and-intents-on-accept case.
  A decider that needs to persist events with no intents, or stage a
  standalone notification (e.g. rejection notification via
  `StageNotifications`), still uses the narrower capabilities directly — this
  ADR does not unify all outbound writes into one interface.
- The composed writer's `gateway` field in its `GatewayFailure` is a single
  identity (`"InMemoryTransactionalWriter"`), which is coarser than knowing
  specifically which underlying store was at fault. This is intentional (see
  Alternatives), but callers that want the finer-grained identity lose it.
- Only `openMembership` was migrated. The other command use cases under
  `examples/v5/modules/membership/useCases/commands/` are unimplemented stubs
  with no repository or persistence of their own; they inherit this pattern
  automatically once built out, but nothing was retrofitted onto them.

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
are an accepted decision's events and its intents — that is precisely what the
outbox pattern (ADR-0003) exists to guarantee. A narrower, purpose-built
capability (`AppendEventsAndIntents`) says exactly what it does; a generic
unit-of-work abstraction would need real design work (nesting, rollback
semantics, adapter participation) with no second use case yet to validate it
against.

### Alternative 2: Preserve two distinct `gateway` identities on failure

Keep reporting `gateway: "InMemoryEventStore"` or `gateway:
"InMemoryIntentOutbox"` from the composed writer, depending on which
underlying store was actually faulted, instead of one unified
`"InMemoryTransactionalWriter"` identity.

**Rejected because:** reporting two distinct gateway identities from what is
now one atomic operation re-introduces the two-gateways framing this ADR
removes. A real transactional-outbox setup has the events table and the
outbox table in the same database — one gateway, one identity — which is the
model this adapter is standing in for.

### Alternative 3: Retrofit all six other command use cases in the same change

Build out `decide.ts`, `repository.ts`, and `handler.ts` for
`acceptTermsOfService`, `activateMembership`, `changeAddress`, `changeEmail`,
`closeMembership`, and `verifyEmail`, wiring atomic persistence into each.

**Rejected because:** those use cases are empty scaffolds today — no decide
logic, no repository, nothing to persist. Implementing them is a separate,
much larger effort than adding atomicity to existing persistence, and doing
so here would conflate "add atomicity" with "implement six new features."
They get the same pattern automatically once someone builds them out, since
`AppendEventsAndIntents` is now the library-level capability for this.

## References

- ADR-0003: Intent and Outbox Pattern (`packages/v5/docs/adr/0003-intent-and-outbox-pattern.md`)
- ADR-009: Outbound Ports Return ResultAsync; Rejection Stays in the Ok Channel
- `packages/v5/src/module/adapters/outbound/capabilities/AppendEventsAndIntents.ts`
- `examples/v5/shared/adapters/outbound/TransactionalWriter.InMemory.ts`
- `examples/v5/modules/membership/useCases/commands/openMembership/handler.ts`
- [neverthrow](https://github.com/supermacro/neverthrow)
