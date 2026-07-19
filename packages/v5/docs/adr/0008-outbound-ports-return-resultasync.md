# ADR-0008: Outbound Ports Return ResultAsync; Rejection Stays in the Ok Channel

**Date:** 2026-07-18 (originally 2026-07-16)
**Status:** Accepted
**Context:** v5 outbound adapters and use-case handlers

## Context

ADR-0007 adopted neverthrow for the inbound pipeline but left the domain and
outbound layers value-based: the event store, outbox, and projection store were
typed `Promise<T | GatewayFailure>`. Handlers then did their own value→result
plumbing — `await` a port, inspect the resolved value with `isFailure(...)`, and
re-route into `errAsync(...)`. The port advertised a value that *might* be a
failure, so every step had to re-discover the failure and lift it onto the rail.

## Decision

Instantiate the outbound port capabilities with `ResultAsync<T, GatewayFailure>`
instead of `Promise<T | GatewayFailure>`, so the railway is native from the
adapter outward. The library capability interfaces are unchanged — they are
already generic over `TResult` (ADR-0001) — so only the example's instantiations
and implementations move.

- **Adapters** (`InMemoryEventStore`, `InMemoryOutbox`, `InMemoryProjectionStore`)
  return `ResultAsync` from every method, using `okAsync`/`errAsync`.
- **Repository / handlers / projector / relay** compose `.map`/`.andThen`
  directly; the `isFailure` lifting disappears.
- **The command handler keeps the domain `Decision` in the Ok channel** — its
  type is `ResultAsync<Decision, GatewayFailure[]>`. An accepted *or* rejected
  decision is a success value; only infrastructure failures are `Err`. The
  inbound adapter branches on `decision.accepted` (202 vs. 409) and maps `Err`
  to 503.

## Rationale

- **The port contract should match the railway.** Typing the port as
  `ResultAsync<T, GatewayFailure>` makes the track switch happen once, at the
  adapter where the failure is produced, instead of at every call site.
- **Rejection is not an error (ADR-0003, ADR-0009).** A `Rejection` is a
  first-class business outcome; modelling it as `Err` would conflate "business
  said no" with "infrastructure broke." Keeping it in Ok makes the adapter's
  `Err` branch mean exactly one thing: infrastructure failure.
- **The decider stays pure.** `decide()` still returns a plain `Decision`
  (ADR-0003); it has no I/O and no failure channel, and is invoked with `.map`
  inside the handler's chain.

## Consequences

- Handlers read as a single railway: `load → decide → store + stage`, with
  `ResultAsync.combineWithAllErrors` collecting store/outbox failures as a
  `GatewayFailure[]` — the array shape is intrinsic, not hand-built.
- The example's outbound layer depends on neverthrow; the library packages do
  not (they stay generic over `TResult`).
- HTTP mapping lives inline in each inbound adapter's `.match`: rejection → 409,
  gateway failure → 503.

## Alternatives Considered

- **A `fromFailable` boundary helper** over `Promise<T | GatewayFailure>` —
  rejected; it papers over a port that misrepresents its own result.
- **Push neverthrow into the decider** (`Result<Accepted, Rejection>`) — rejected;
  `decide` is pure and total, encoding a rejection as an error contradicts
  ADR-0003/0009 and couples the sans-I/O core to a library.
- **Route rejection into the `Err` channel** — rejected; it mixes a single-value
  `Rejection` with a `GatewayFailure[]` array the adapter must re-discriminate.

## References

- ADR-0003: Command Handling
- ADR-0007: Inbound Pipeline Uses neverthrow
- ADR-0009: Outcome Taxonomy — Rejection / Failure / Invalid
