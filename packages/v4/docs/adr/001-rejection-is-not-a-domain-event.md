# ADR-001: Rejection is Not a Domain Event

**Date:** 2026-02-18  
**Status:** Accepted  
**Context:** v4 ScenarioTest implementation

## Context

When implementing `ScenarioTest` for v4, we needed to decide how to model and persist command rejections (e.g., duplicate create, validation failures, concurrency conflicts).

## Decision

`Rejection` is **not** a domain event and must **never** be written to the event store.

## Rationale

### Domain Events Model State Changes

Domain events are immutable facts representing state changes that already happened:
- `OrderCreated` — the order now exists
- `PaymentProcessed` — the payment succeeded
- `UserActivated` — the user is now active

### Rejections Model Refused Commands

A rejection represents a command that was **refused** — the aggregate decided *not* to change state:
- No state transition occurred
- Nothing to replay during event sourcing
- Not part of the aggregate's history

### Semantic Boundary

Putting rejections in the event stream blurs the distinction between:
- **"Something happened"** (domain event)
- **"Something was prevented from happening"** (rejection)

This violates the core principle of event sourcing: the event stream is the single source of truth for *what happened*.

## Consequences

### Positive

- Clear semantic separation between facts and refusals
- Event store remains append-only, immutable history
- Aggregate state can be rebuilt purely from domain events
- Aligns with DDD/CQRS/Event Sourcing literature

### Negative

- Rejections need a separate persistence mechanism (outbox) if durability is required
- Two paths for command outcomes (events → event store, rejections → outbox)

## Alternatives Considered

### Alternative 1: Store Rejections as Domain Events

Create events like `CreateUserRejected` and append them to the event stream.

**Rejected because:**
- Violates event sourcing semantics (no state change occurred)
- Pollutes the aggregate's history with non-facts
- Complicates `evolve()` — what state does a rejection produce?

### Alternative 2: Store Rejections in a Separate "Rejection Stream"

Maintain a parallel event stream for rejections.

**Rejected because:**
- Adds complexity (two streams per aggregate)
- Rejections are ephemeral notifications, not durable history
- The outbox pattern already provides the needed durability

## Implementation

```typescript
/**
 * Rejection models a failed command decision. It is NOT part of the aggregate
 * event stream. Persist via an outbox/inbox if you need durability and emit an
 * IntegrationEvent with outcome="rejected" for external consumers.
 */
export interface Rejection<TDetails = unknown> {
  id: string
  commandId: string
  commandType: string
  reasonCode: string
  // ...
}
```

## References

- [Cosmic Python: Events and Message Bus](https://www.cosmicpython.com/book/chapter_08_events_and_message_bus.html)
- [Stack Overflow: Applying rejections in aggregates](https://stackoverflow.com/questions/63188514/applying-rejections-in-aggregates-in-spine-event-engine)
- ADR-002: Outbox Owns IntegrationEvent Conversion
- ADR-004: Decider Returns Rejection for Business Rule Violations

