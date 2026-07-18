# isDomainEvent

> Type guard that narrows an unknown value to `DomainEvent`.

## What it is

`isDomainEvent` is a runtime type guard that checks whether a value is
specifically a [`DomainEvent`](./DomainEvent.md) — as opposed to an
[`IntegrationEvent`](../../infrastructure/docs/IntegrationEvent.md),
[`ExternalEvent`](../../infrastructure/docs/ExternalEvent.md), or
[`Rejection`](./Rejection.md). It delegates the broad structural check to
[`isEvent`](./isEvent.md), then adds two domain-specific conditions:
the presence of `aggregateId` and `kind === 'domain'`.

This guard is particularly important in projection handlers (see ADR-006),
which subscribe to the [`EventBus`](../../infrastructure/docs/EventBus.md)
and may receive any type of event. Using `isDomainEvent` before accessing
`aggregateId` or domain-specific payload fields prevents runtime errors and
keeps the narrowing explicit rather than relying on unsafe casts.

The separation of `isEvent` (broad) and `isDomainEvent` (narrow) follows the
**SOLID** Interface Segregation Principle — callers that only care about the
common event shape use `isEvent`, while those that need domain-specific fields
use `isDomainEvent`.

## Interface

```typescript
export function isDomainEvent(event: unknown): event is DomainEvent;
```

## Usage

In a projection handler (from `examples/UserProjection.ts`):

```typescript
import { isDomainEvent } from "@domain/utils/isDomainEvent.ts";

class UserProjection {
  async handle(anEvent: DomainEvent | IntegrationEvent | ExternalEvent): Promise<void> {
    if (isDomainEvent(anEvent) && anEvent.type === "UserCreated") {
      // anEvent is narrowed to DomainEvent — aggregateId is guaranteed
      await this.database.execute("users", {
        operation: Operation.CREATE,
        payload: { id: anEvent.aggregateId, ...anEvent.payload },
      });
    }
  }
}
```

## Related

- **Tests**: [`isEvent.spec.ts`](../utils/isEvent.spec.ts)
- **See also**: [`isEvent`](./isEvent.md), [`isRejection`](./isRejection.md),
  [`isDomainEvent` in ADR-006](../../../docs/adr/006-projection-handlers-guard-on-is-domain-event.md)
- **Examples**: [`UserProjection.ts`](../../core/examples/UserProjection.ts)
- **Used by**: [`ScenarioTest`](../../infrastructure/docs/ScenarioTest.md),
  projection handlers
