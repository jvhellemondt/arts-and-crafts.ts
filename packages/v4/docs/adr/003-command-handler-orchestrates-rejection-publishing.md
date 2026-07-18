# ADR-003: Command Handler Orchestrates Rejection Publishing

**Date:** 2026-02-18  
**Status:** Accepted  
**Context:** v4 ScenarioTest implementation

## Context

After `Decider.decide()` returns a `Rejection`, we needed to decide which layer is responsible for publishing it to the outbox.

## Decision

The **command handler** (application layer) orchestrates rejection publishing by injecting the `Outbox` and calling `outbox.enqueue(rejection)` directly.

## Rationale

### Clean/Hexagonal Architecture Alignment

In Clean/Hexagonal Architecture:
- **Domain layer:** Business logic (`Decider.decide()`)
- **Application layer:** Use case orchestration (command handlers)
- **Infrastructure layer:** Technical implementations (`Outbox`, `EventStore`)

The command handler sits at the **application layer** and orchestrates ports (abstractions). Injecting `Outbox` (a port) is exactly what hexagonal architecture prescribes.

### Repository is the Wrong Abstraction

The `Repository` interface has `load()` and `store()` — both are collection operations. Adding `reject(rejection)` would be a semantic mismatch:
- `store(events)` → "store events in the repository" ✅
- `reject(rejection)` → "reject in the repository" ❌ (meaningless)

A rejection isn't being *stored in* a collection — it's a **decision outcome** that needs to be *published*.

### Separation of Concerns

Domain events and rejections follow different paths:
- **Domain events:** repository → event store → (DynamoDB Stream) → outbox
- **Rejections:** command handler → outbox directly (bypass event store)

The command handler is the natural decision point for routing outcomes.

### Established Pattern

The [Transactional Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html) states:

> *The service that sends the message first stores the message in the database as part of the transaction that updates the business entities.*

For rejections, the "transaction" is the outbox write itself. The command handler orchestrates this.

## Consequences

### Positive

- Command handler stays at the application layer (no domain logic)
- Clean separation: domain decides, application orchestrates, infrastructure executes
- No semantic mismatch in the `Repository` interface
- Easy to add rejection-specific logic (e.g., metrics, alerting) in the handler

### Negative

- Command handlers now depend on two ports (`Repository` + `Outbox`) instead of one
- All command handler constructors need updating (breaking change)

## Implementation

### Command Handler

```typescript
export class CreateUserHandler implements CommandHandler<RegisterUserCommand> {
  constructor(
    private readonly repository: Repository<UserEvent, Promise<UserState>, Promise<void>>,
    private readonly outbox: Outbox,
  ) {}

  async execute(aCommand: RegisterUserCommand): Promise<void> {
    const currentState = await this.repository.load(aCommand.aggregateId)
    const result = User.decide(aCommand, currentState)
    
    if (isRejection(result)) {
      await this.outbox.enqueue(result)
    }
    else {
      await this.repository.store(result)
    }
  }
}
```

### Responsibility Split

| Concern | Layer | Component |
|---|---|---|
| Business decision | Domain | `Decider.decide()` |
| Persisting state changes | Application → Infrastructure | `Repository.store()` |
| Publishing rejections | Application → Infrastructure | `Outbox.enqueue()` |
| Delivery to event bus | Infrastructure | `OutboxWorker` |

## Alternatives Considered

### Alternative 1: Repository.reject() Method

Add a `reject(rejection: Rejection): Promise<void>` method to the `Repository` interface.

**Rejected because:**
- Semantic mismatch (repository is a collection abstraction)
- Violates interface segregation (not all repositories need rejection handling)
- Couples repository to outbox infrastructure

### Alternative 2: CommandBus Intercepts Rejections

Change `CommandHandler.execute()` to return `void | Rejection`, and have `CommandBus` inspect the return value and enqueue rejections centrally.

**Rejected because:**
- Requires changing `CommandHandler` interface (larger breaking change)
- CommandBus becomes stateful (needs outbox dependency)
- Harder to test (command bus now has side effects)
- Doesn't work with `Promise<void>` return type

### Alternative 3: Decider Enqueues Directly

Pass the outbox into `decide()` so it can enqueue rejections itself.

**Rejected because:**
- Violates domain purity (decider should be a pure function)
- Couples domain logic to infrastructure
- Makes testing harder (need to mock outbox in domain tests)

## References

- [Microservices.io: Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- ADR-001: Rejection is Not a Domain Event
- ADR-002: Outbox Owns IntegrationEvent Conversion
- ADR-004: Decider Returns Rejection for Business Rule Violations

