# isIntegrationEvent

> Type guard for a v5 `IntegrationEvent` read from outside the type system.

## What it is

An integration event that arrives over a queue or a topic is `unknown` until
something checks it. `isIntegrationEvent` checks the envelope structurally:
`kind` is `'integration'`, `id` and `type` are strings, `timestamp` is a number
and `metadata` is an object.

As with [`isDomainEvent`](../../../core/isDomainEvent/docs/isDomainEvent.md), the
payload is not checked — that takes the schema for the event's `type`, which
the guard cannot know.

## Interface

```typescript
export function isIntegrationEvent(value: unknown): value is IntegrationEvent;
```

## Usage

```typescript
import { isIntegrationEvent } from "@arts-and-crafts/v5-utils/adapters/outbound";

const parsed: unknown = JSON.parse(record.body);

if (!isIntegrationEvent(parsed)) {
  throw new Error("Queue message body is not an integration event");
}

await publisher.publish(parsed);
```

## Related

- **See also**: [`isDomainEvent`](../../../core/isDomainEvent/docs/isDomainEvent.md),
  [`toIntegrationEvent`](./toIntegrationEvent.md)
- **Tests**: [`isIntegrationEvent.test.ts`](../isIntegrationEvent.test.ts)
