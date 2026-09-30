# isDomainEvent

> Type guard for a v5 `DomainEvent` read from outside the type system.

## What it is

A domain event that comes back from storage — a database row, a change-stream
record, a deserialised message — is `unknown` until something checks it.
`isDomainEvent` checks the envelope structurally: `kind` is `'domain'`, `id`
and `type` are strings, `timestamp` is a number, `concerns` is an array and
`metadata` is an object.

The payload is deliberately not checked. What a valid payload looks like
depends on the event's type, and that is its schema's job — a guard that
accepted only known payloads would have to know every event type there is. A
caller that needs the payload validated parses it against the schema for the
event's `type` after the guard.

## Interface

```typescript
export function isDomainEvent(value: unknown): value is DomainEvent;
```

## Usage

```typescript
import { isDomainEvent } from "@arts-n-crafts/ts/v5-utils/module/core";
import { toIntegrationEvent } from "@arts-n-crafts/ts/v5-utils/module/adapters/outbound";

const candidate: unknown = JSON.parse(record.body);

if (isDomainEvent(candidate)) {
  await queue.send(toIntegrationEvent(candidate));
}
```

## Related

- **See also**: [`isIntegrationEvent`](../../../adapters/outbound/docs/isIntegrationEvent.md),
  [`toIntegrationEvent`](../../../adapters/outbound/docs/toIntegrationEvent.md)
- **Tests**: [`isDomainEvent.spec.ts`](../isDomainEvent.spec.ts)
