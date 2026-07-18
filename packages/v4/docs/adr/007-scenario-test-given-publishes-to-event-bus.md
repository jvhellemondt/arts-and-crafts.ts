# ADR-007: ScenarioTest Given Step Publishes to Event Bus

**Date:** 2026-02-18  
**Status:** Accepted  
**Context:** v4 ScenarioTest implementation

## Context

The `ScenarioTest.given()` step sets up past events as test fixtures. Query tests need projections (read models) to be populated from these events. We needed to decide whether `given()` should only store events in the repository or also publish them through the event bus.

## Decision

The `given()` step both stores domain events in the repository **and** publishes them through the event bus, ensuring projection handlers are triggered and query models are populated.

## Rationale

### Query Tests Require Projections

Query tests follow this pattern:
```typescript
await scenario
  .given(UserCreated, UserNameUpdated)  // setup
  .when(GetUserByEmail)                 // query
  .then([{ id, name: 'Donald', ... }])  // expected result
```

The query handler reads from a projection (e.g., `userDatabase`). The projection is built by `UserProjectionHandler`, which subscribes to the event bus. Without publishing the `given` events, the projection remains empty.

### Mirrors Production Behavior

In production:
1. Command handler calls `repository.store(events)`
2. Repository calls `eventStore.append(events)`
3. Event store enqueues to outbox
4. Outbox worker publishes to event bus
5. Projection handlers react and update query models

The `given()` step simulates steps 1-5 by:
1. Storing events in the repository (for aggregate rehydration)
2. Publishing events through the event bus (for projections)

### Consistency with Event Handlers

Event handler tests already use `given()` to trigger side effects:
```typescript
await scenario
  .when(UserCreated)
  .then(UserRegistrationEmailSent)  // side effect event
```

This works because `when(event)` publishes through the event bus. The `given()` step should behave consistently.

## Consequences

### Positive

- Query tests work correctly (projections are populated)
- Consistent behavior between `given()` and `when(event)`
- Tests verify the full event flow (store + publish)
- No need for manual projection setup in tests

### Negative

- `given()` has side effects (publishes to event bus)
- Event handlers subscribed to the bus are triggered during setup
- Slightly slower tests (more async operations)
- Potential for unexpected side effects if handlers have bugs

## Implementation

### ScenarioTest.then()

```typescript
async then(thenInput: ThenInput): Promise<void> {
  const domainEvents = this.givenInput.filter(isDomainEvent)
  const integrationEvents = this.givenInput.filter(isIntegrationEvent)

  await Promise.all([
    this.repository.store(domainEvents),
    ...domainEvents.map(async event => this.eventBus.consume(this.streamName, event)),
    ...integrationEvents.map(async event => this.eventBus.consume(this.streamName, event)),
  ])

  // ...rest of test execution...
}
```

### Test Setup

```typescript
beforeEach(() => {
  // ...
  eventBus.subscribe(collectionName, new UserProjectionHandler(userDatabase))
  // ...
})

it('should query users by email', async () => {
  await scenarioTest
    .given(
      createUserCreatedEvent(id, { name: 'Elon', email: 'elon@x.com' }),
      createUserNameUpdatedEvent(id, { name: 'Donald' }),
    )
    .when(createGetUserByEmailQuery({ email: 'elon@x.com' }))
    .then([{ id, name: 'Donald', email: 'elon@x.com', prospect: true }])
})
```

## Alternatives Considered

### Alternative 1: Manual Projection Setup

Require tests to manually populate projections:
```typescript
await userDatabase.execute('users', { 
  operation: Operation.CREATE, 
  payload: { id, name: 'Elon', email: 'elon@x.com' } 
})
```

**Rejected because:**
- Duplicates projection logic in tests (violates DRY)
- Tests don't verify projection handlers work correctly
- Brittle (breaks if projection schema changes)

### Alternative 2: given() Only Stores, Separate populate() Step

Add a `populate()` method that publishes events:
```typescript
.given(events)
.populate()
.when(query)
.then(result)
```

**Rejected because:**
- Adds API complexity
- Easy to forget the `populate()` step
- Doesn't align with BDD semantics (given should fully set up state)

### Alternative 3: Lazy Projection Population

Trigger `outboxWorker.tick()` before executing queries, relying on the outbox to publish events.

**Rejected because:**
- Requires events to be in the outbox first (circular dependency)
- Slower (extra async tick)
- Doesn't work for `given(IntegrationEvent)` (not in outbox)

## Trade-offs

### Side Effects in Setup

The `given()` step now triggers event handlers, which may have side effects (e.g., `UserCreatedEventHandler` stores `UserRegistrationEmailSent`). This is acceptable because:
- It mirrors production behavior
- Tests verify the full system integration
- Side effects are deterministic (in-memory implementations)

### Performance

Publishing events adds async overhead, but:
- Tests remain fast (in-memory implementations)
- The benefit (correct projection state) outweighs the cost
- Can be optimized later if needed (e.g., batch publishing)

## References

- [Martin Fowler: Given-When-Then](https://martinfowler.com/bliki/GivenWhenThen.html)
- [Event Sourcing: Projections](https://eventsourcing.readthedocs.io/en/v6.0.0/topics/projections.html)
- ADR-006: Projection Handlers Guard on isDomainEvent

