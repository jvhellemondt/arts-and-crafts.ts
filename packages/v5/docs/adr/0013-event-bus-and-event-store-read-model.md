---
status: accepted
date: 2026-05-18
decision-makers: []
---

# ADR-0013: Event Store Read Model and Pull-Based Consumption

## Context and Problem Statement

ADR-0009 (event relay) and ADR-0011 (projection rebuild) both assume the event store exposes a pull API by position (`load_from(checkpoint)`) and that consumers maintain durable checkpoints. ADR-0010 was originally drafted to deliver events via an in-process broadcast channel, but on closer inspection that design coupled command-write latency to projection-apply latency and was incompatible with the assumed channel buffering. ADR-0010 has since been revised to pick the polling option.

Even with that flip, the read model needed to be made concrete: `StoredEvent` already carried `globalPosition` and `streamVersion` internally, but `LoadDomainEvents.load(stream, aggregateId)` stripped them, and no read-by-position API existed on the event store. There was also no checkpoint port. This ADR records the read-side contract that makes ADR-0009, ADR-0010 (revised), and ADR-0011 implementable against shared infrastructure.

## Decision Drivers

- Consumers (projectors, event relays) must be able to checkpoint where they are without consulting a side channel
- The event store remains the sole source of truth — there is no broadcast medium
- Aggregate rehydration must not be burdened with stream coordinates it does not need
- The contract must be a credible in-process analogue of a Kafka deployment so the migration path is mechanical
- Capability ports stay single-purpose, consistent with the existing FCIS style

## Considered Options

1. Expose only `LoadDomainEvents.load(stream, aggregateId)` and rely on side channels for positions
2. Replace `LoadDomainEvents` with a single position-aware API used for both rehydration and catchup
3. Keep `LoadDomainEvents` for rehydration and add two position-aware reads (`LoadEventsFrom`, `LoadEventStreamFrom`) plus a `Checkpoint` port co-located with the projection store

## Decision Outcome

Chosen option 3: **`LoadDomainEvents` retained for aggregate rehydration; `LoadEventsFrom` and `LoadEventStreamFrom` added for position-aware catchup; `LoadCheckpoint` / `AdvanceCheckpoint` co-located with the projection store** — because rehydration and catchup have different consumers and shouldn't share a signature, and because the checkpoint genuinely belongs next to the projection state per ADR-0010.

### Consequences

* Good, because projectors and event relays receive `globalPosition` on every read and can checkpoint without a side channel
* Good, because `LoadDomainEvents.load` stays unchanged — `MembershipRepository` and other aggregate consumers pay nothing for coordinates they don't use
* Good, because rebuild (ADR-0011) and the event relay (ADR-0009) are now implementable against the existing capability ports
* Good, because the contract is the Kafka contract: `loadFrom(position)` is a consumer rewind, `streamKey` is the partition key, `globalPosition` is the offset, `LoadCheckpoint` / `AdvanceCheckpoint` are the committed offset
* Bad, because two read paths exist on the event store (`load` for rehydration, `loadFrom` / `loadStreamFrom` for catchup) — implementers must keep them consistent
* Bad, because `Checkpoint` lives on the projection store rather than as a standalone port — projectors and event relays share that interface, and a relay with no projection still needs a checkpoint backing (acceptable: the methods are independent of projection state)

### Confirmation

Compliance is confirmed by verifying that `LoadEventsFrom.loadFrom` and `LoadEventStreamFrom.loadStreamFrom` exist on the event store and return `StoredEvent<TEvent>[] | GatewayFailure`; that `LoadDomainEvents.load` is unchanged; that the projection store implements `LoadCheckpoint` / `AdvanceCheckpoint`; that both new read paths surface `GatewayFailure` under simulated offline mode.

## Event Store Read Model

The event store exposes three read paths, each used by a different consumer shape:

| Capability | Use case | Returns |
|---|---|---|
| `LoadDomainEvents.load(stream, aggregateId)` | Aggregate rehydration in the repository | `TEvent[]` |
| `LoadEventStreamFrom.loadStreamFrom(streamKey, fromVersion)` | Per-aggregate catchup, e.g. resuming a stream-bound subscription | `StoredEvent<TEvent>[]` |
| `LoadEventsFrom.loadFrom(globalPosition, limit?)` | Projector polling (ADR-0010), projection rebuild (ADR-0011), event relay tailing (ADR-0009) | `StoredEvent<TEvent>[]` |

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
| `LoadEventsFrom.loadFrom(position, limit?)` | Consumer poll / rewind to an offset |
| `LoadEventStreamFrom.loadStreamFrom(streamKey, fromVersion)` | Seek within a partition |
| `LoadCheckpoint` / `AdvanceCheckpoint` | Committed offset on the consumer group |
| `StoredEvent.stream` | Topic |
| `StoredEvent.streamKey` | Partition key — guarantees ordering per aggregate |
| `StoredEvent.globalPosition` | Offset across the whole log |

A projector that runs against `InMemoryEventStore` today compiles against a Kafka-backed adapter tomorrow without changing its `tick` logic — only the underlying `loadFrom` and checkpoint implementations change.

## Rules

1. Consumers pull events from the event store by `globalPosition` — the event store never pushes
1. `LoadDomainEvents.load(stream, aggregateId)` is used only for aggregate rehydration — never for projector or relay catchup
1. `loadFrom` and `loadStreamFrom` return rows in their natural ordering — `globalPosition` ascending and `streamVersion` ascending respectively
1. A consumer advances its checkpoint only after the corresponding state change has been persisted — never before
1. Idempotency is the consumer's responsibility; pulling by position from a stored checkpoint guarantees it naturally
1. Both new read paths surface infrastructure failure as `GatewayFailure` — consumers bail without advancing the checkpoint and retry on the next tick
