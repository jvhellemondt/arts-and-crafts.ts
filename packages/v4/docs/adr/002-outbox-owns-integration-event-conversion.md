# ADR-002: Outbox Owns IntegrationEvent Conversion

**Date:** 2026-02-18  
**Status:** Accepted  
**Context:** v4 ScenarioTest implementation

## Context

Both `DomainEvent` and `Rejection` need to be published externally (Kafka, audit logs, New Relic) as `IntegrationEvent`s. We needed to decide where the conversion responsibility belongs.

## Decision

The `Outbox` owns the conversion from `DomainEvent | Rejection` to `IntegrationEvent`. Callers pass internal types to `outbox.enqueue()`, and the outbox converts them before storing.

## Rationale

### Single Responsibility

The outbox is the **boundary** between internal and external messages:
- Internal: `DomainEvent` (event sourcing), `Rejection` (command outcome)
- External: `IntegrationEvent` (wire contract)

Placing conversion at this boundary keeps the concern localized.

### Caller Simplicity

Command handlers and the event store don't need to know about `IntegrationEvent`:
- `eventStore.append(domainEvents)` → outbox converts internally
- `outbox.enqueue(rejection)` → outbox converts internally

### Consistent Storage

`OutboxEntry.event` is always `IntegrationEvent` — no union types, no runtime checks needed by the outbox worker.

## Consequences

### Positive

- Conversion logic centralized in one place
- Callers stay infrastructure-agnostic
- Outbox worker publishes a uniform message type
- Easy to add new internal types (e.g., `Saga`) without changing callers

### Negative

- `Outbox` interface widened from `enqueue(IntegrationEvent)` to `enqueue(DomainEvent | Rejection)` — minor breaking change for existing implementations

## Implementation

### Interface

```typescript
interface Queueable<TReturnType = Promise<void>> {
  enqueue(event: DomainEvent | Rejection): TReturnType
}

export interface OutboxEntry {
  id: string
  event: IntegrationEvent  // always converted
  published: boolean
  retryCount: number
  lastAttemptAt?: number
}
```

### InMemoryOutbox

```typescript
async enqueue(event: DomainEvent | Rejection): Promise<void> {
  const integrationEvent = isRejection(event)
    ? convertRejectionToIntegrationEvent(event)
    : convertDomainEventToIntegrationEvent(event)
  this.entries.push(createOutboxEntry(integrationEvent))
}
```

### Conversion Helpers

**`convertDomainEventToIntegrationEvent`:**
```typescript
export function convertDomainEventToIntegrationEvent(event: DomainEvent): IntegrationEvent {
  return createIntegrationEvent(event.type, event.payload, {
    outcome: 'accepted',
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
  })
}
```

**`convertRejectionToIntegrationEvent`:**
```typescript
export function convertRejectionToIntegrationEvent(rejection: Rejection): IntegrationEvent {
  return createIntegrationEvent(
    rejection.commandType,
    { ...rejection.details, reasonCode: rejection.reasonCode },
    {
      outcome: 'rejected',
      aggregateType: rejection.aggregateType,
      aggregateId: rejection.aggregateId,
      commandType: rejection.commandType,
      commandId: rejection.commandId,
    },
  )
}
```

## Alternatives Considered

### Alternative 1: Callers Convert Before Enqueueing

Command handlers and event store call `convertXToIntegrationEvent()` before `outbox.enqueue()`.

**Rejected because:**
- Scatters conversion responsibility across multiple callers
- Command handlers need to know about `IntegrationEvent` (leaks infrastructure concern)
- Harder to enforce consistency (callers might forget to convert)

### Alternative 2: Outbox Stores Union Type

`OutboxEntry.event: DomainEvent | Rejection | IntegrationEvent`

**Rejected because:**
- Outbox worker needs runtime checks to determine message type
- Inconsistent storage format complicates serialization
- Doesn't solve the "when to convert" question

## References

- [Microservices.io: Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html)
- ADR-001: Rejection is Not a Domain Event
- ADR-003: Command Handler Orchestrates Rejection Publishing

