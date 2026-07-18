# ADR-006: Projection Handlers Guard on isDomainEvent

**Date:** 2026-02-18  
**Status:** Accepted  
**Context:** v4 ScenarioTest implementation

## Context

The outbox worker publishes `IntegrationEvent`s through the event bus. Event handlers subscribed to the bus receive both:
- `DomainEvent`s (from direct `eventBus.publish()` calls)
- `IntegrationEvent`s (from `outboxWorker.tick()`)

Projection handlers (e.g., `UserProjectionHandler`) build query models by reacting to domain events. Without proper guards, they would process the same event twice.

## Decision

Projection handlers must guard on `isDomainEvent(event)` before processing, ensuring they only react to internal domain events and ignore integration events re-published by the outbox worker.

## Rationale

### Prevent Duplicate Processing

Without the guard:
1. `given(UserCreated)` → `eventBus.consume()` → `UserProjectionHandler` creates user in database
2. `outboxWorker.tick()` → publishes `IntegrationEvent` with `type: 'UserCreated'`
3. `UserProjectionHandler` receives it → tries to `CREATE` user again → `DuplicateRecordException`

### Semantic Correctness

Projection handlers build **internal** query models from **internal** domain events. They should not react to:
- `IntegrationEvent`s (external wire format)
- `ExternalEvent`s (events from other bounded contexts)

### Type Safety

The guard provides a type-safe narrowing:
```typescript
isUserCreatedEvent(anEvent: DomainEvent | IntegrationEvent | ExternalEvent): anEvent is UserCreatedEvent {
  return isDomainEvent(anEvent) && anEvent.type === 'UserCreated'
}
```

TypeScript now knows `anEvent.aggregateId` exists (only on `DomainEvent`).

## Consequences

### Positive

- Prevents duplicate processing bugs
- Clear semantic boundary (internal vs external events)
- Type-safe access to `DomainEvent`-specific fields (`aggregateId`, `aggregateType`)
- Projection handlers ignore outbox worker re-publications

### Negative

- Boilerplate: every projection handler type guard needs `isDomainEvent(anEvent) &&`
- Easy to forget the guard (no compile-time enforcement)
- Slightly more verbose type guards

## Implementation

### UserProjectionHandler

```typescript
export class UserProjectionHandler implements EventHandler<UserEvent> {
  constructor(
    private readonly database: Database<UserModel, Promise<void>, Promise<UserModel[]>>,
  ) {}

  isUserCreatedEvent(anEvent: DomainEvent | IntegrationEvent | ExternalEvent): anEvent is UserCreatedEvent {
    return isDomainEvent(anEvent) && anEvent.type === 'UserCreated'
  }

  isUserNameUpdatedEvent(anEvent: DomainEvent | IntegrationEvent | ExternalEvent): anEvent is UserNameUpdatedEvent {
    return isDomainEvent(anEvent) && anEvent.type === 'UserNameUpdated'
  }

  async handle(anEvent: DomainEvent | IntegrationEvent | ExternalEvent): Promise<void> {
    if (this.isUserCreatedEvent(anEvent)) {
      const user = { id: anEvent.aggregateId, ...anEvent.payload }
      await this.database.execute('users', { operation: Operation.CREATE, payload: user })
    }
    if (this.isUserNameUpdatedEvent(anEvent)) {
      const updatePayload = { id: anEvent.aggregateId, ...anEvent.payload }
      await this.database.execute('users', { operation: Operation.PATCH, payload: updatePayload })
    }
  }
}
```

### Pattern

**Projection handlers (build query models):**
```typescript
isEventType(e): e is EventType {
  return isDomainEvent(e) && e.type === 'EventType'  // ✅ guard on kind
}
```

**Saga/process managers (react to any event):**
```typescript
isEventType(e): e is EventType {
  return e.type === 'EventType'  // ✅ no guard (react to both)
}
```

## Alternatives Considered

### Alternative 1: Separate Event Buses

Maintain separate event buses for `DomainEvent` and `IntegrationEvent`.

**Rejected because:**
- Doubles infrastructure complexity
- Harder to test (need two buses)
- Doesn't align with production (single Kafka topic per stream)

### Alternative 2: Outbox Worker Publishes to Different Stream

Publish `IntegrationEvent`s to a different stream name (e.g., `users-external`).

**Rejected because:**
- Breaks stream semantics (one stream per aggregate type)
- Projection handlers would need to subscribe to multiple streams
- Complicates routing and partitioning

### Alternative 3: Filter at EventBus Level

Add a `filter` parameter to `eventBus.subscribe()` to only receive certain event kinds.

**Rejected because:**
- Adds complexity to the event bus interface
- Harder to reason about (implicit filtering)
- The guard pattern is explicit and type-safe

## Future Considerations

If the boilerplate becomes problematic, consider:
- A `createProjectionHandler()` factory that auto-adds the `isDomainEvent` guard
- ESLint rule to enforce the guard in projection handlers
- Base class `ProjectionHandler` with the guard built-in

## References

- [Event-Driven Architecture Patterns](https://www.enterpriseintegrationpatterns.com/patterns/messaging/)
- ADR-002: Outbox Owns IntegrationEvent Conversion

