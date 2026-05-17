---
status: accepted
date: 2026-05-17
decision-makers: []
---

# ADR-0013: Event Bus Payload and Event Store Read Model

## Context and Problem Statement

ADR-0010 chose an in-process broadcast channel as the delivery mechanism between the event store and projectors. ADR-0009 (event relay) and ADR-0011 (projection rebuild) both assume the event store exposes a pull API by position (`load_from(checkpoint)`) and that consumers maintain durable checkpoints. The implementation up to this point provided only the push side: a bus broadcasting bare `DomainEvent`s, with no way for a subscriber to know its position in the stream and no read-by-position API on the store. That made the relay and the rebuild strategy impossible to implement against the current ports, even though `StoredEvent` already carried `globalPosition` and `streamVersion` internally.

## Decision Drivers

- Subscribers (projectors, event relays) must be able to checkpoint where they are without consulting a side channel
- The event store remains the sole source of truth — the bus is an optimisation, never a durable log
- Aggregate rehydration must not be burdened with stream coordinates it does not need
- The shape must be a credible in-process analogue of a Kafka deployment so the migration path is mechanical
- Capability ports stay single-purpose, consistent with the existing FCIS style

## Considered Options

1. Leave the bus carrying `DomainEvent` and add a separate side-channel API for positions
2. Replace the bus with a pull-only model where consumers poll the store by position
3. Have the bus carry `StoredEvent` (event plus stream coordinates) while the store also exposes pull-by-position APIs and a checkpoint port on the projection store

## Decision Outcome

Chosen option 3: **bus carries `StoredEvent`, event store exposes `loadFrom` and `loadStreamFrom`, projection store carries `loadCheckpoint` / `advanceCheckpoint`** — because it keeps the push-based broadcast that ADR-0010 selected, gives every subscriber the coordinates it needs for idempotency and checkpointing, and matches the Kafka analogue cleanly enough that the migration is a port swap rather than a redesign.

### Consequences

* Good, because projectors and event relays can checkpoint against the projection store using `globalPosition` carried on every received event — no side channel
* Good, because the bus delivery contract is no richer than what a Kafka consumer record already provides — `stream` is the topic, `streamKey` is the partition key, `globalPosition` is the offset
* Good, because aggregate rehydration via `LoadDomainEvents.load(stream, aggregateId)` is unchanged — repositories do not pay for coordinates they do not use
* Good, because rebuild (ADR-0011) and the event relay (ADR-0009) can now be implemented purely against the existing capability ports
* Bad, because every subscriber must destructure `stored.event` to reach the domain payload — a small ergonomic tax in exchange for the position metadata
* Bad, because two read paths now exist on the event store (`load` for rehydration, `loadFrom` / `loadStreamFrom` for catchup) — implementers must keep them consistent
* Bad, because `Checkpoint` lives on the projection store rather than on a standalone port — projectors and event relays share a store interface, and a relay that has no projection still needs a checkpoint backing

### Confirmation

Compliance is confirmed by verifying that `PublishEvents.publish` and `ConsumeEvents.consume` take `StoredEvent<TEvent>`; that the in-memory event store publishes the wrapped form rather than bare events on append; that `loadFrom` and `loadStreamFrom` exist on the event store and surface `GatewayFailure` under simulated offline mode; and that the projection store implements `LoadCheckpoint` / `AdvanceCheckpoint`.

## Bus Payload

The bus delivers a `StoredEvent<TEvent>`:

```
StoredEvent {
  stream,           // aggregateType — the "topic"
  streamKey,        // `${aggregateType}#${aggregateId}` — the "partition key"
  streamVersion,    // version within the stream
  globalPosition,   // store-wide ordering — the "offset"
  insertedAt,       // write-time, distinct from event.timestamp
  event,            // the underlying DomainEvent
}
```

Subscribers that only need the domain fact destructure `stored.event`. Subscribers that need durable progress read `stored.globalPosition` for idempotency keys and checkpoint advancement.

## Event Store Read Model

The event store exposes three read paths, each used by a different consumer shape:

| Capability | Use case | Returns |
|---|---|---|
| `LoadDomainEvents.load(stream, aggregateId)` | Aggregate rehydration in the repository | `TEvent[]` |
| `LoadEventStreamFrom.loadStreamFrom(streamKey, fromVersion)` | Per-aggregate catchup, e.g. resuming a stream-bound subscription | `StoredEvent<TEvent>[]` |
| `LoadEventsFrom.loadFrom(globalPosition, limit?)` | Projection rebuild (ADR-0011), event relay tailing (ADR-0009) | `StoredEvent<TEvent>[]` |

`load` strips positions because aggregate rehydration applies the `evolve` function which only depends on the domain fact. The two pull APIs return `StoredEvent` because their callers checkpoint or deduplicate by position.

## Checkpoint

The checkpoint is co-located with the projection state, per ADR-0010. The projection store implements two ports:

```
LoadCheckpoint.loadCheckpoint(): Promise<number | GatewayFailure>
AdvanceCheckpoint.advanceCheckpoint(position): Promise<void | GatewayFailure>
```

`loadCheckpoint` returns `0` when no advance has occurred — equivalent to "start from the beginning." `advanceCheckpoint` is called only after the projection state has been successfully saved, never before (per ADR-0010 rules).

The event relay (ADR-0009) uses the same ports against its own backing store — there is no "projection" but the checkpoint semantics are identical, so the ports are reused rather than duplicated as a separate `EventRelayCheckpoint` interface.

## Kafka Analogue

The in-process model maps onto a Kafka deployment as a one-to-one port swap:

| In-process port | Kafka equivalent |
|---|---|
| `InMemoryEventBus.publish(stored)` | Producer publishing to a topic with `streamKey` as key |
| `RegisterEventSubscriber.subscribe(stream, handler)` | Consumer subscribing to a topic, filtering on type |
| `LoadEventsFrom.loadFrom(position)` | Consumer rewind to an offset |
| `LoadCheckpoint` / `AdvanceCheckpoint` | Committed offset on the consumer group |
| `StoredEvent.stream` | Topic |
| `StoredEvent.streamKey` | Partition key — guarantees ordering per aggregate |
| `StoredEvent.globalPosition` | Offset across the whole log |

A subscriber that runs against `InMemoryEventBus` today should compile against a Kafka-backed `PublishEvents` adapter tomorrow without changing its `consume` signature.

## Rules

1. The bus only ever carries `StoredEvent` — bare `DomainEvent` instances cross the bus boundary only as `stored.event`
2. The event store publishes to the bus after a successful append — never before
3. Subscribers that need durable progress advance their checkpoint only after the corresponding state change has been persisted
4. Aggregate rehydration uses `LoadDomainEvents.load`, not the pull-by-position APIs
5. `loadFrom` and `loadStreamFrom` return rows in their natural ordering — `globalPosition` ascending and `streamVersion` ascending respectively
6. A subscriber that crashes mid-batch must be safe to restart from its last checkpoint — idempotency is the subscriber's responsibility, the bus does not retry
