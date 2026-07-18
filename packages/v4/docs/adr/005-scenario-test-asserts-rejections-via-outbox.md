# ADR-005: ScenarioTest Asserts Rejections via Outbox

**Date:** 2026-02-18  
**Status:** Accepted  
**Context:** v4 ScenarioTest implementation

## Context

`ScenarioTest` provides a BDD-style fluent API for testing event-sourced aggregates:

```typescript
await scenario
  .given(pastEvents)
  .when(command)
  .then(expectedEvent)
```

With the introduction of `Rejection`, we needed to decide how to assert that a command was rejected.

## Decision

Overload `then()` to accept a `Rejection`. When `when(command)` is followed by `then(rejection)`, assert the outbox contains a matching `IntegrationEvent` with `outcome: 'rejected'`.

## Rationale

### Maintain Existing Interface

Adding a new method like `thenRejects(rejection)` would:
- Break the fluent API symmetry
- Require users to remember two different methods
- Add cognitive overhead

Overloading `then()` keeps the interface consistent:
```typescript
.then(expectedEvent)    // assert event in event store
.then(expectedRejection) // assert rejection in outbox
```

### Outbox is the Source of Truth

Rejections are published as `IntegrationEvent`s via the outbox. Asserting against the outbox verifies:
- The rejection was created
- It was converted to `IntegrationEvent` correctly
- It will be published to external consumers

### Type Safety

The overload is type-safe:
```typescript
type ThenInput = DomainEvent | Rejection | Array<Record<string, unknown>>
```

TypeScript ensures callers pass a valid outcome type.

## Consequences

### Positive

- Consistent fluent API (no new methods)
- Type-safe assertion of both events and rejections
- Tests verify the full rejection flow (decide → enqueue → convert → publish)
- Clear error messages when assertions fail

### Negative

- `then()` signature is more complex (union type)
- Requires `isRejection()` runtime check to branch assertion logic
- Slightly less discoverable than a dedicated `thenRejects()` method

## Implementation

### ScenarioTest.then()

```typescript
async then(thenInput: ThenInput): Promise<void> {
  // ...setup...
  
  if (isCommand(this.whenInput)) {
    invariant(
      isDomainEvent(thenInput) || isRejection(thenInput),
      fail(new TypeError('When "command" expects a domain event or rejection in the then-step')),
    )
    await this.handleCommand(this.whenInput, thenInput)
    return
  }
  // ...other cases...
}
```

### handleCommand() with Rejection

```typescript
private async handleCommand(command: Command, outcome: DomainEvent | Rejection): Promise<void> {
  await this.commandBus.execute(command)

  if (isRejection(outcome)) {
    const pending = await this.outbox.getPending()
    const foundRejection = pending.find(
      entry =>
        entry.event.metadata.outcome === 'rejected'
        && entry.event.metadata.commandType === outcome.commandType
        && (entry.event.payload as { reasonCode?: string }).reasonCode === outcome.reasonCode,
    )
    invariant(!!foundRejection, fail(new Error('ScenarioTest: rejection was not found in outbox')))
    return
  }

  // ...assert event in event store...
}
```

### Usage Example

```typescript
it('should reject duplicate user creation', async () => {
  await scenarioTest
    .given(createUserCreatedEvent(id, { name: 'Elon', email: 'elon@x.com' }))
    .when(createRegisterUserCommand(id, { name: 'Elon', email: 'elon@x.com' }))
    .then({
      id: randomUUID(),
      commandId: randomUUID(),
      commandType: 'CreateUser',
      reasonCode: 'ALREADY_EXISTS',
      timestamp: Date.now(),
    })
})
```

## Alternatives Considered

### Alternative 1: Separate thenRejects() Method

Add a dedicated method for rejection assertions:
```typescript
.when(command)
.thenRejects({ reasonCode: 'ALREADY_EXISTS' })
```

**Rejected because:**
- Breaks API symmetry (two different methods for outcomes)
- More methods to learn and remember
- Doesn't provide significant clarity benefit

### Alternative 2: Assert on CommandBus Return Value

Change `CommandBus.execute()` to return `void | Rejection` and assert on the return value.

**Rejected because:**
- Requires changing `CommandBus` interface (larger breaking change)
- Doesn't verify the rejection was enqueued to the outbox
- Misses the conversion and publishing flow

### Alternative 3: Separate Rejection Assertion Helper

Provide a separate `assertRejection(outbox, expected)` utility.

**Rejected because:**
- Breaks the fluent API flow
- Requires manual outbox access in tests
- Less ergonomic than the overloaded `then()`

## References

- [BDD: Given-When-Then](https://martinfowler.com/bliki/GivenWhenThen.html)
- ADR-001: Rejection is Not a Domain Event
- ADR-002: Outbox Owns IntegrationEvent Conversion
- ADR-003: Command Handler Orchestrates Rejection Publishing

