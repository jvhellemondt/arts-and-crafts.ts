# toIntegrationEvent

> Maps a `DomainEvent` onto the `IntegrationEvent` that leaves the bounded context.

## What it is

Domain events stay inside the bounded context; what crosses its edge is an
integration event. `toIntegrationEvent` makes that crossing, re-kinding the
event as `'integration'` and dropping three fields rather than renaming them:

- `concerns` names the event store's internal streams — its dynamic
  consistency boundary. It means nothing to a consumer.
- `commandId` / `commandType` are domain-internal provenance. What crosses the
  wire for tracing is `metadata.correlationId` / `metadata.causationId`.

`id` is kept, so a consumer can deduplicate on it — and so can a replay of the
same event through a producer. The `type` and `payload` types of the domain
event carry over to the integration event.

## Interface

```typescript
export function toIntegrationEvent<TType, TPayload>(
  event: DomainEvent<TType, TPayload>,
): IntegrationEvent<TType, TPayload>;
```

## Usage

```typescript
import { isDomainEvent } from "@arts-n-crafts/ts/v5-utils/module/core";
import { toIntegrationEvent } from "@arts-n-crafts/ts/v5-utils/module/adapters/outbound";

if (isDomainEvent(candidate)) {
  await queue.send(toIntegrationEvent(candidate));
}
```

## Related

- **See also**: [`isDomainEvent`](../../../core/isDomainEvent/docs/isDomainEvent.md),
  [`isIntegrationEvent`](./isIntegrationEvent.md)
- **Tests**: [`toIntegrationEvent.test.ts`](../toIntegrationEvent.test.ts)
