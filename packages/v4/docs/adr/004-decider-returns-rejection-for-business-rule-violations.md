# ADR-004: Decider Returns Rejection for Business Rule Violations

**Date:** 2026-02-18  
**Status:** Accepted  
**Context:** v4 ScenarioTest implementation

## Context

When a command violates a business rule (e.g., duplicate create, invalid state transition), the decider needs to communicate this failure. We needed to decide how to model this in the `Decider` interface.

## Decision

Widen `Decider.decide()` to return `TEvent[] | Rejection`. Business rule violations return a `Rejection` instead of an empty array or throwing an exception.

## Rationale

### Semantic Clarity

Returning `[]` (empty array) loses information:
- **Why** did nothing happen?
- Was it a no-op (idempotent command) or a business rule violation?
- Should the caller retry?

A `Rejection` carries rich metadata:
```typescript
{
  reasonCode: 'ALREADY_EXISTS',
  classification: 'business',
  retryable: false,
  reason: 'User already exists'
}
```

### Type Safety

The return type `TEvent[] | Rejection` makes the failure case **explicit** in the type system. Callers must handle both outcomes:

```typescript
const result = User.decide(command, state)
if (isRejection(result)) {
  // handle rejection
} else {
  // handle events
}
```

### Domain Purity

Rejections are **domain decisions**, not infrastructure errors:
- "This user already exists" is a business rule, not a technical failure
- The decider is the right place to model this decision
- Keeps domain logic pure (no exceptions, no side effects)

### Aligns with Result Types

The pattern mirrors `Result<T, E>` from functional programming — the decider returns either success (events) or failure (rejection), both as values.

## Consequences

### Positive

- Rich rejection metadata for observability and debugging
- Type-safe handling of both outcomes
- No exceptions thrown from domain logic
- Clear distinction between business rejections and technical errors

### Negative

- **Breaking change:** All existing `Decider` implementations must be updated
- Callers must now branch on `isRejection()` (more boilerplate)
- Tests expecting `[]` for no-ops must be updated

## Implementation

### Decider Interface

```typescript
export interface Decider<TState, TCommand, TEvent extends DomainEvent> {
  decide(this: void, command: TCommand, currentState: TState): TEvent[] | Rejection
  evolve(this: void, currentState: TState, event: TEvent): TState
  initialState(this: void, id: string): TState
}
```

### User Example

```typescript
function decideUserState(command: UserCommand, currentState: UserState): UserEvent[] | Rejection {
  switch (command.type) {
    case 'CreateUser': {
      if (!isInitialState(currentState)) {
        return {
          id: command.id,
          commandId: command.id,
          commandType: command.type,
          aggregateType: command.aggregateType,
          aggregateId: command.aggregateId,
          reasonCode: 'ALREADY_EXISTS',
          reason: 'User already exists',
          classification: 'business',
          retryable: false,
          timestamp: command.timestamp,
        } satisfies Rejection
      }
      return [createUserCreatedEvent(command.aggregateId, command.payload)]
    }
    // ...
  }
}
```

### Command Handler

```typescript
async execute(command: RegisterUserCommand): Promise<void> {
  const currentState = await this.repository.load(command.aggregateId)
  const result = User.decide(command, currentState)
  
  if (isRejection(result)) {
    await this.outbox.enqueue(result)
  } else {
    await this.repository.store(result)
  }
}
```

## Alternatives Considered

### Alternative 1: Throw Exceptions

Throw a `BusinessRuleViolationException` from `decide()`.

**Rejected because:**
- Exceptions are for **unexpected** errors, not expected business outcomes
- Breaks domain purity (side effects)
- Harder to test (need try/catch everywhere)
- Loses type safety (exception types not tracked in return type)

### Alternative 2: Return Empty Array for Rejections

Keep returning `[]` for business rule violations.

**Rejected because:**
- Loses semantic information (why did nothing happen?)
- No metadata for observability
- Caller can't distinguish between idempotent no-op and rejection
- Can't communicate `retryable` flag to infrastructure

### Alternative 3: Return `Result<TEvent[], Rejection>`

Use `Result` from `oxide.ts` for all decider returns.

**Rejected because:**
- More verbose for the common case (success)
- Requires `unwrap()` boilerplate in every caller
- The `TEvent[] | Rejection` union is simpler and equally type-safe

## Migration Guide

### Before

```typescript
function decide(command, state): TEvent[] {
  if (violatesBusinessRule) {
    return []  // silent no-op
  }
  return [event]
}
```

### After

```typescript
function decide(command, state): TEvent[] | Rejection {
  if (violatesBusinessRule) {
    return {
      id: command.id,
      commandId: command.id,
      commandType: command.type,
      reasonCode: 'BUSINESS_RULE_VIOLATED',
      classification: 'business',
      timestamp: command.timestamp,
    } satisfies Rejection
  }
  return [event]
}
```

## References

- [Cosmic Python: Commands and Command Handler](https://www.cosmicpython.com/book/chapter_10_commands.html)
- ADR-001: Rejection is Not a Domain Event
- ADR-003: Command Handler Orchestrates Rejection Publishing

