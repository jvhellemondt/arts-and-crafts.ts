# ADR-0011: Projection Rebuild Strategy

## Status

Accepted

## Context and Problem Statement

ADR-0010 establishes that a schema version mismatch triggers an automatic rebuild of a projection from position zero.
This ADR specifies how that rebuild works in detail — how events are sourced during replay, how the projection store
behaves during rebuild, how queries are served while rebuild is in progress, and what happens when rebuild fails.

## Decision Drivers

- Rebuild must be triggered automatically on schema version mismatch — no manual step
- Rebuild must be correct — the rebuilt projection must be identical to one built from scratch
- The projection store must not serve queries with logically inconsistent state during rebuild
- Rebuild failure must be observable and recoverable
- The event store is the sole source of truth for replay — no secondary source

## Considered Options

1. Pause queries during rebuild — projection store returns a rebuilding status, query handler surfaces this to the
   caller
2. Serve stale state during rebuild — old projection continues serving queries until rebuild completes, then swapped
   atomically
3. Serve partial state during rebuild — projection store reflects whatever has been applied so far, queries may return
   incomplete results
4. Block startup until rebuild completes — process does not accept queries until all projections are ready

## Decision Outcome

Chosen option 1: **Pause queries during rebuild — projection store returns a rebuilding status, query handler surfaces
this to the caller**, because it is correct, explicit, and honest — callers know the system is temporarily unavailable
for that query rather than receiving silently incorrect results. For an in-memory monolith where rebuild is fast, the
pause window is acceptably short.

---

## Rebuild Trigger

Rebuild is triggered automatically by the projector on startup when the schema version stored in the projection store
does not match the projector's declared schema version. It is also triggered if the projection store is empty and no
checkpoint exists — treating a missing projection as equivalent to a version mismatch.

Rebuild is never triggered during normal operation. It is a startup concern only. If the projection schema changes at
runtime, the process must be restarted — the new projector version detects the mismatch on startup and rebuilds.

---

## Rebuild Lifecycle

The rebuild follows a strict sequence:

1. Projector detects version mismatch or missing projection on startup
2. Projection store is set to rebuilding status — queries return a rebuilding error immediately
3. Projection store state is cleared — all existing projection data is discarded
4. Checkpoint is reset to zero
5. Technical event written: `ProjectionRebuildStarted`
6. Projector loads all events from the event store from position zero in batches
7. For each event — apply pure apply function, accumulate state
8. After all events are applied — save final projection state to projection store
9. Save new schema version and final checkpoint position to projection store
10. Projection store rebuilding status is cleared — queries resume normally
11. Technical event written: `ProjectionRebuildCompleted`
12. Projector resumes its normal polling loop from the saved checkpoint

The polling loop is suspended during rebuild. Once rebuild completes and the new schema version and checkpoint are
saved, polling resumes from the new checkpoint position and catches up to the present on subsequent ticks.

---

## Projection Store During Rebuild

The projection store exposes a rebuilding flag. While the flag is set, load operations return a `ProjectionUnavailable`
error instead of projection state. The query handler translates this to an appropriate response — a 503 Service
Unavailable for HTTP callers, or an explicit error variant for other transports.

The rebuilding flag is set before clearing state and cleared only after the new schema version and checkpoint are saved.
There is no window where the store is partially rebuilt and serving queries — it is either fully unavailable or fully
ready.

---

## Event Sourcing During Replay

During rebuild the projector reads from the event store in larger batches than its normal polling tick. The event
store exposes a load-by-position operation that returns all events from a given position in order:

```
event store:
  load_from(position: EventPosition) -> Vec<(EventPosition, Event)>
```

The projector calls this with position zero for a full rebuild. Events are loaded in batches to avoid holding all events
in memory simultaneously for large event histories. Batch size is configurable in the shell.

The projector applies each batch sequentially. State is accumulated in memory during replay and written to the
projection store only once — after the final batch is applied. This means the projection store remains in rebuilding
status and serves no partial state until the full replay is complete.

---

## Rebuild Failure Handling

If the event store returns an error during replay, or if writing the rebuilt projection to the store fails, the rebuild
is considered failed:

1. Technical event written: `ProjectionRebuildFailed` with reason
2. Projection store remains in rebuilding status — queries continue to return unavailable
3. Projector waits for a configured backoff duration
4. Projector retries the full rebuild from position zero

The projector retries indefinitely with backoff until rebuild succeeds or the process is restarted. There is no partial
retry from a mid-rebuild checkpoint — each retry starts from position zero to guarantee correctness.

Rebuild failure is surfaced via technical events. The process does not crash on rebuild failure — it retries. If
repeated failures occur, the technical event store provides the signal for investigation.

---

## Query Handler Behaviour During Rebuild

The query handler receives a `ProjectionUnavailable` error from the projection store and translates it to an explicit,
typed response. It does not return empty results or a partial list — it surfaces the unavailability explicitly:

- HTTP — 503 Service Unavailable with a `Retry-After` hint
- Internal — `QueryError::ProjectionUnavailable` variant returned to the caller

This is honest — callers know to retry rather than treating an empty result as authoritative.

---

## Rebuild Observability

All rebuild lifecycle stages are captured as technical events. This provides full observability over rebuild duration,
event count, failure reasons, and retry history:

- `ProjectionRebuildStarted` — projection name, schema version, timestamp
- `ProjectionRebuildCompleted` — projection name, events replayed, duration, new schema version, timestamp
- `ProjectionRebuildFailed` — projection name, reason, attempt number, timestamp
- `ProjectionRebuildRetrying` — projection name, backoff duration, timestamp

Rebuild duration is derivable from the `Started` and `Completed` technical events. If rebuilds are consistently slow,
the event count in `Completed` indicates whether the event history is growing too large for comfortable in-memory
replay — the signal for introducing snapshots.

---

## Relationship to Snapshot Pattern

For aggregates with very long event histories, full replay during rebuild can become slow. The snapshot pattern —
storing a point-in-time snapshot of projection state alongside its checkpoint — allows rebuild to start from the
snapshot position rather than position zero, replaying only the events since the snapshot.

The snapshot pattern is not specified in this ADR. When rebuild duration reported in technical events indicates a
problem, a dedicated ADR for the snapshot pattern should be written. The rebuild strategy described here is compatible
with snapshots — the only change would be the starting position passed to the event store load operation.

---

## Rules

1. Rebuild is always triggered on schema version mismatch — it is never skipped or deferred
2. The projection store serves no queries during rebuild — callers receive an explicit unavailable response
3. Projection state is written to the store only after the full replay is complete — never incrementally during rebuild
4. Each rebuild retry starts from position zero — partial retries from a mid-rebuild checkpoint are not permitted
5. Rebuild failure is retried indefinitely with backoff — the process never crashes on rebuild failure
6. Technical events are written for every rebuild lifecycle stage — started, completed, failed, retrying

---

## Consequences

### Positive

- Rebuild is automatic and correct — no manual migration step, no risk of serving stale schema state
- Queries receive an explicit unavailable response during rebuild — no silently incorrect results
- Rebuild failure is observable and self-healing via retry — no operator intervention required for transient failures
- The strategy is compatible with the snapshot pattern when event histories grow large

### Negative

- Queries are unavailable for the duration of rebuild — acceptable for fast in-memory replay, must be monitored as event
  history grows
- Full rebuild from position zero on every retry means a persistent event store error causes repeated full replays —
  mitigated by backoff and technical event alerting

### Risks

- Rebuild duration growing unnoticed as event history accumulates — monitor via `ProjectionRebuildCompleted` technical
  events and alert when duration exceeds a threshold
- Callers not handling 503 responses gracefully during rebuild — document the rebuilding behaviour as part of the API
  contract and include `Retry-After` hints
- Schema version constant not being updated when the projection schema changes — enforce in code review; a missing
  version bump means the old projection is served silently without rebuild
