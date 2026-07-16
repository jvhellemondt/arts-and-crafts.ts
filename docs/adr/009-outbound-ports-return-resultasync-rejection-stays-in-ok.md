# ADR-009: Outbound Ports Return ResultAsync; Rejection Stays in the Ok Channel

**Date:** 2026-07-16
**Status:** Accepted
**Context:** v5 outbound adapters and use-case handlers (`examples/v5`)

## Context

[ADR-008](./008-inbound-pipeline-uses-neverthrow-not-middleware-frameworks.md)
adopted neverthrow for the **inbound** pipeline but deliberately kept it out of
the domain and outbound layers (its "Alternative 1: Push neverthrow Into the
Domain Too" was *rejected for now*). As a result the outbound ports still
returned union values: the event store, outbox, and projection store were typed
`Promise<T | GatewayFailure>`, and `runCommand`/`runQuery` lifted the handler's
`GatewayFailure[] | Rejection` union into a `ResultAsync` at the boundary.

That left the use-case handlers doing their own value→result plumbing. A handler
`await`ed each port, then manually inspected the resolved value with
`isFailure(...)` and re-routed into `errAsync(...)`:

```ts
return fromSafePromise(this.repository.load(id, email))
  .andThen((loadResult) => {
    if (isFailure(loadResult)) return errAsync([loadResult]); // union → Err
    return okAsync(decideOpenMembership(loadResult, command));
  })
  // …combine store + outbox, then filter(isFailure) again
```

The ports advertised a value that *might* be a failure, so every step had to
re-discover the failure and lift it onto the railway. The obvious "fix" — a
`fromFailable(promise)` helper that wraps each call — only relocates the lift; it
does not remove the impedance mismatch, because the port contract itself is what
lies.

## Decision

Instantiate the outbound port capabilities with
`ResultAsync<T, GatewayFailure>` instead of `Promise<T | GatewayFailure>`, so the
railway is native from the adapter outward. The library capability interfaces are
**unchanged** — they are already generic over their return type
(`LoadDomainEvents<TEvent, TResult>`, `LoadProjection<TState, TResult>`, …), so
only the example's instantiations and implementations move.

- **Adapters** (`InMemoryEventStore`, `InMemoryOutbox`, `InMemoryProjectionStore`)
  return `ResultAsync`, using `okAsync`/`errAsync` — every method, so a host
  never sees a half-`Result` contract.
- **Repository / handlers / projector / relay** compose `.map`/`.andThen`
  directly. `isFailure`/`fromFailable`-style lifting disappears; there is no
  union left to inspect.
- **The command handler keeps the domain `Decision` in the Ok channel.** Its
  type is `ResultAsync<Decision, GatewayFailure[]>`: an accepted *or* rejected
  decision is a success value; only infrastructure `GatewayFailure`s are `Err`.
  The inbound adapter branches on `decision.accepted` to choose the response
  (202 vs. 409), and maps the `Err` channel to 503.
- **The example no longer uses `runCommand`/`runQuery`.** With handlers already
  returning `ResultAsync`, the adapters call `handler.handle(...)` and `.match`
  the result. The library helpers remain for consumers that still return union
  values.

## Rationale

### The Port Contract Should Match the Railway

`fromSafePromise` on a `T | GatewayFailure` promise puts a *possible failure* in
the **success** channel, forcing each step to unpack it. Typing the port as
`ResultAsync<T, GatewayFailure>` makes the track switch happen once, at the
adapter, where the failure is actually produced.

### Rejection Is Not an Error (ADR-001, ADR-004)

A `Rejection` is a first-class business outcome — the command was understood and
the domain said no. Modelling it as `Err` would conflate "business said no" with
"infrastructure broke." The `Decision` shape's own documentation is explicit:
*both* `Accepted` and `Rejected` are returned as `Ok`; only `GatewayFailure` is
`Err`. Keeping rejection in the Ok channel honours that contract and keeps the
adapter's `Err` branch meaning exactly one thing: infrastructure failure.

### The Decider Stays Pure

`decide()` still returns the `Decision` union (ADR-004) — it is not wrapped in a
`Result`. It has no I/O and therefore no failure channel; it is invoked with
`.map(...)` inside the handler's chain. The `ScenarioTest` `given/when/then`
flow keeps asserting on plain decisions.

## Consequences

### Positive

- Handlers read as a single railway: `load → decide → store+stage`, no manual
  `isFailure` filtering and no `fromFailable` boundary helper.
- `ResultAsync.combineWithAllErrors` collects failures from the store and outbox
  as a `GatewayFailure[]` — the array shape is intrinsic, not hand-built.
- The adapter `Err` branch is unambiguously infrastructure (503); domain
  rejection is handled on the Ok branch (409).

### Negative

- The example's outbound layer now depends on neverthrow (the library packages
  do not — they stay generic over `TResult`).
- HTTP status mapping moved inline into each inbound adapter's `.match`, since
  the deleted `resolveError`/hooks no longer exist. Command rejection now maps
  to **409** (was 404) and gateway failure to **503** (was 500).

### Confirmation

`pnpm run lint`, `pnpm run typecheck`, `pnpm run coverage` (100% thresholds),
and the example's shell integration tests all pass.

## Alternatives Considered

### Alternative 1: A `fromFailable` Boundary Helper

Keep the ports as `Promise<T | GatewayFailure>` and lift each call with a small
`fromFailable(promise): ResultAsync<T, GatewayFailure>` helper.

**Rejected because:** it papers over a port that misrepresents its own result.
The helper would appear at every call site; fixing the contract removes the need
entirely.

### Alternative 2: Push neverthrow Into the Decider

Make `decide()` return `Result<Accepted, Rejection>`.

**Rejected because:** `decide` is pure and total — it never fails, so there is no
`Err` channel to model. It would encode a business rejection as an error
(contradicting ADR-001/ADR-004 and the `Decision` contract) and couple the
sans-I/O `domain/core` layer to a library. It also would not remove the outbound
lifting, which is the actual impedance mismatch.

### Alternative 3: Route Rejection Into the Err Channel

Type the handler `ResultAsync<void, GatewayFailure[] | Rejection>`.

**Rejected because:** it contradicts the `Decision` doc contract (rejection is an
expected `Ok` outcome, not an error) and mixes a single-value `Rejection` with a
`GatewayFailure[]` array in one `Err` union, which the adapter must then
re-discriminate.

## References

- ADR-001: Rejection is Not a Domain Event
- ADR-004: Decider Returns Rejection for Business Rule Violations
- ADR-008: Inbound Pipeline Uses neverthrow Instead of Middleware Frameworks
  (this ADR enacts its deferred "Alternative 1" for the outbound/handler layer)
- `packages/v5/src/module/useCases/command/shapes/Decision.ts`
- [neverthrow](https://github.com/supermacro/neverthrow)
