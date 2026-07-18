# ADR-0002: Runtime and Shell Model

**Date:** 2026-07-18
**Status:** Accepted
**Context:** v5 shell (`examples/v5/shell`)

## Context

The pure core and its ports (ADR-0001) need a host that wires concrete adapters
and drives the background work event sourcing implies — projections must be
brought up to date and staged intents must be dispatched. The same use cases
must run both as a long-lived server and as discrete serverless invocations.

## Decision

Provide two shell shapes over one composition root:

- **Long-running process** — `shell/main.ts` composes the in-memory adapters,
  serves the Hono app (`@hono/node-server`), and runs two polling **background
  workers** on timers: the intent relay (`~1000ms`) and the projector
  (`~100ms`). It installs `SIGINT`/`SIGTERM` handlers that stop the timers and
  close the server for graceful shutdown.
- **Serverless handlers** — `shell/apps/lambda/*` export per-use-case
  `APIGatewayProxyEventV2` handlers. A projection-backed query invokes
  `projector.tick()` before serving so a warm container catches up on demand.

Each app builds the handler from outbound dependencies and injects them
(ADR-0003); wiring lives in the shell, never in a use case.

## Rationale

- **Workers are polling loops, not a framework.** `setInterval(relay.tick)` and
  `setInterval(projector.tick)` are enough; each tick is an idempotent,
  checkpoint-driven catch-up (ADR-0004, ADR-0005), so a missed or overlapping
  tick is safe.
- **One core, many runtimes.** Because the ports are generic capabilities, the
  Hono server and the Lambda handlers share the same handlers and adapters; only
  the transport translation and the worker-scheduling differ.
- **Composition at the edge.** The shell owns lifetimes (timers, server, process
  signals) and dependency wiring, keeping the core free of runtime concerns.

## Consequences

- Read-after-write is eventually consistent: a projection reflects a command
  only after the next projector tick (ADR-0004).
- The in-memory adapters are process-local and non-durable — a deliberate
  placeholder for a real event store / outbox / projection store.
- Serverless deployments must trigger the relay/projector out-of-band (schedule
  or per-invocation `tick`), since there is no always-on timer.

## References

- ADR-0001: Modular FCIS Folder Structure
- ADR-0004: Query and Projection Handling
- ADR-0005: Intents, Outbox, and Intent Relay
