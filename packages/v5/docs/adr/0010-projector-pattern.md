# ADR-0010: Projector Pattern

## Status

Accepted

## Context and Problem Statement

Query handlers read from pre-built projections as established in ADR-0006. Something must build and maintain those projections by processing domain events as they are written. We need a consistent pattern for how projectors observe events, apply them to projection state, manage their position in the event stream, and handle schema changes — in a monolithic, in-memory deployment.

## Decision Drivers

- The command handler must not be responsible for notifying projectors — it has its own lifecycle concerns
- The event store must not know about projectors — it should remain unaware of its consumers
- A slow or failing projector must not affect the write path or other projectors
- Each query use case owns its own projector — projectors are not shared across query handlers
- Projection state and checkpoint position are co-located in the projection store
- Schema changes must trigger automatic rebuild without manual intervention
- The pattern must be a credible in-process analogue of a durable event stream consumer (Kafka) so future migration is a port swap, not a redesign

## Considered Options

1. Command handler calls projectors directly after persisting events
1. Event store notifies registered projectors via callback
1. In-process pub/sub channel — event store publishes, projectors subscribe independently
1. Polling loop — projector reads new events on an interval

## Decision Outcome

Chosen option 4: **Polling loop — each projector reads new events from the event store on an interval, applies them, and advances its checkpoint**, because it keeps the event store unaware of its consumers, gives projectors true isolation (a slow projector cannot slow the write path), is identical in shape to the Kafka consumer model, and reuses the same `loadFrom(checkpoint)` + checkpoint pattern ADR-0009 already adopted for the event relay.

Option 3 (in-process channel) was rejected on closer inspection: a synchronous fan-out from inside `append()` couples command-write latency to projection-apply latency, contradicting the isolation requirement above. It also relies on a buffered channel that does not exist in the in-process model, leaving restart and rebuild races unmodelled. Option 4's cost is up to `interval` ms of read-side staleness — acceptable for an in-memory monolith and, more importantly, the same staleness window any real consumer of a real event stream pays.

-----

## Projector Polling

Each projector owns its position in the global event stream and pulls events from the event store by `globalPosition`:

```
projector tick:
  checkpoint ← projection store
  batch ← event store loadFrom(checkpoint + 1, batchSize)
  for each stored event in batch:
    next ← apply(state, stored.event)
    save next to projection store
    advance checkpoint to stored.globalPosition
```

The event store knows nothing about projectors. Adding or removing a projector requires no changes to the event store. Projectors do not interact with each other.

-----

## Projector Scope

Each query use case owns exactly one projector. The projector is responsible for one projection and nothing else. It lives alongside its query use case:

```
use_cases/
  list_time_entries/
    mod.rs
    queries.rs
    projection.rs      // projection state and apply function
    projector.rs       // projector — pulls events, updates projection store
    handler.rs         // query handler — reads from projection store
    inbound/
      http.rs
```

Projectors for different query use cases have no knowledge of each other. Each polls the event store independently.

-----

## Projection Store

The projection store holds both the projection state and the checkpoint position. It is shared between the projector (writer) and the query handler (reader) via a port:

```
shared/infrastructure/projection_store/
  mod.rs        // pub trait ProjectionStore<P>
  in_memory.rs  // in-memory implementation
```

The port exposes load, save, checkpoint read (`loadCheckpoint`), and checkpoint advance (`advanceCheckpoint`) operations. The projector writes; the query handler reads. Neither knows about the other's existence — they only know about the store.

The projection store also holds the current schema version. On startup, the projector reads the stored schema version and compares it to its own declared version. A mismatch triggers an automatic rebuild before normal processing resumes.

-----

## Projection State and Apply

The projection itself is a pure data structure with a pure apply function. It lives in the use case alongside the projector.

The apply function takes the current projection state and a single domain event and returns the updated state. It has no side effects. The projector unwraps `stored.event` from each pulled `StoredEvent`, passes it to apply, and writes the result back to the projection store.

Only events relevant to the projection are applied. Events the projection does not care about are ignored — apply matches on event type and returns the current state for unrecognised variants.

-----

## Schema Versioning and Automatic Rebuild

Each projector declares a schema version as a constant. On startup, the projector reads the schema version stored in the projection store and compares it to its declared version:

- If versions match — normal polling resumes from the stored checkpoint position
- If versions differ — the projector clears the projection store, resets the checkpoint to zero, replays all events from the beginning via `loadFrom(0)` in batches, and saves the new schema version once complete

Rebuild details are specified in ADR-0011.

-----

## Projector Runtime

Each projector exposes a single `tick()` method that performs one pull-and-apply pass. The shell schedules `tick()` on a fixed interval. The projector itself owns no timer — this matches the existing `IntentRelay.relay()` pattern.

`tick()` performs:

1. Load the checkpoint from the projection store
1. Call `loadFrom(checkpoint + 1, batchSize)` on the event store
1. For each returned `StoredEvent` — apply the inner event to the current state, save the new state, advance the checkpoint to `stored.globalPosition`
1. Write a technical event per applied event
1. Return

Any infrastructure failure (`GatewayFailure` from the projection store or event store) causes the tick to return early without advancing the checkpoint. The next tick retries from the same checkpoint position. Idempotency falls out naturally — events at or below the checkpoint are never re-pulled.

-----

## Checkpoint

The checkpoint is the `globalPosition` of the last successfully applied event. It is stored alongside the projection state in the projection store. The projector advances the checkpoint after successfully saving the updated projection state — never before.

On rebuild, the checkpoint is reset to zero and advanced event by event through the full replay. The projection store does not serve queries with stale state during rebuild — the projector applies events in order and the store reflects the latest applied state at all times during replay.

-----

## Technical Events

The projector writes a technical event after each successfully applied event and after each rebuild lifecycle stage. This provides observability over projector lag and rebuild duration:

- `ProjectionEventApplied` — event type, projection name, checkpoint position, duration
- `ProjectionRebuildStarted` — projection name, schema version, timestamp
- `ProjectionRebuildCompleted` — projection name, event count replayed, duration, timestamp
- `ProjectionRebuildFailed` — projection name, reason, timestamp

Lag is monitored by comparing the projector's checkpoint to the event store's latest `globalPosition`.

-----

## Folder Structure

```
modules/
  time_entries/
    use_cases/
      list_time_entries/
        mod.rs
        queries.rs
        projection.rs       // ProjectionState, apply fn, SCHEMA_VERSION constant
        projector.rs        // ListTimeEntriesProjector — tick(), rebuild logic
        handler.rs
        inbound/
          http.rs

shared/
  infrastructure/
    projection_store/
      mod.rs                // pub trait ProjectionStore<P>
      in_memory.rs          // InMemoryProjectionStore — state + checkpoint + version
```

-----

## Shell Wiring

The shell instantiates each projector with its projection store and the event store, then schedules `tick()` on a fixed interval. There is no channel, no sender, and no receiver:

```
shell:
  for each query use case:
    create projection store
    create projector(projection_store, event_store)
    schedule setInterval(() => projector.tick(), PROJECTOR_INTERVAL_MS)

  inject projection stores into query handlers
```

This is the same wiring shape the shell already uses for the `IntentRelay`. Multiple projectors run independently — each has its own interval; one running long does not block another.

-----

## Rules

1. The event store has no knowledge of projectors — projectors pull, the store never pushes
1. The projector applies events in `globalPosition` order — the order `loadFrom` returns them
1. The checkpoint advances only after the projection state is successfully saved — never before
1. Any `GatewayFailure` from the projection store or event store causes the current tick to return early without advancing the checkpoint
1. Schema version mismatch always triggers a full rebuild from position zero — partial replay is not permitted
1. The projector ignores events it does not recognise — it does not error on unknown event types
1. The projector never calls the command handler or writes to the event store
1. The query handler never writes to the projection store — only the projector writes
1. Technical events are written for every applied event and every rebuild lifecycle stage

-----

## Consequences

### Positive

- The event store has no knowledge of projectors — adding or removing a projector requires no changes to the event store or the command path
- Projector isolation is real — a slow projector cannot slow the write path, and one projector's failures cannot affect another
- The pattern is identical in shape to a Kafka consumer — migration to a durable event stream is a port swap, not a redesign
- Schema versioning makes projection evolution safe and automatic — no manual migration step
- Crash recovery is trivial — the checkpoint is the only state the projector keeps, and idempotency falls out of pulling by position
- The projection store port means the in-memory implementation can be replaced with a durable one without touching projector or query handler logic

### Negative

- Up to `PROJECTOR_INTERVAL_MS` of read-side staleness — acceptable for in-memory deployments; configurable per projector
- Periodic wakeups even when idle — cheap on an in-memory Map; on a real database the same pattern costs one cheap range scan per tick (and is the same shape ADR-0009 already accepted for the event relay)
- Queries may return stale or empty data immediately after startup while projectors catch up — acceptable for in-memory deployments where catch-up is fast

### Risks

- Developer applying events in the projector outside the pure apply function, introducing side effects — enforce that apply is always a pure function in the projection module; the projector only calls it and saves the result
- Developer writing to the projection store from the query handler — enforce that query handlers are read-only consumers of the projection store
- A projector falling significantly behind under high write load — monitor lag via `ProjectionEventApplied` checkpoint position vs latest `globalPosition`; reduce `PROJECTOR_INTERVAL_MS` or increase `batchSize`
