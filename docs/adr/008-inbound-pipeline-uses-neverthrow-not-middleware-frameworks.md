# ADR-008: Inbound Pipeline Uses neverthrow Instead of Middleware Frameworks

**Date:** 2026-07-14  
**Status:** Accepted  
**Context:** v5 inbound adapters (`v5-utils`, `v5-aws`, `v5-hono`, `examples/v5`)

## Context

The v5 inbound HTTP/Lambda pipeline runs the same steps for every route:
parse the request, derive tracing metadata (correlation/causation ids), build
a `Command`/`Query`, run the handler, and render a response — short-circuiting
on the first error.

This was implemented twice: `v5-aws` wrapped the steps as
[middy](https://middy.js.org) `before`/`onError` middleware, and `v5-hono`
wrapped the same steps as Hono middleware plus an `app.onError` boundary.
Both leaned on their framework's *throw-to-short-circuit* model, even though
the domain already reports errors as **values** — `GatewayFailure[]` and
`Rejection` union returns, never thrown.

To bridge value-based domain results into throw-based middleware, `v5-utils`
converted those values *back* into exceptions: `runCommand`/`runQuery` threw
`FailureError`/`RejectionError`, the parse step threw `ZodError`, and
`resolveError` caught all three and turned them *back* into a
`{status, body}` value. This value → throw → value round-trip existed only to
satisfy the frameworks' error model.

## Decision

Model the inbound pipeline as a [neverthrow](https://github.com/supermacro/neverthrow)
`Result`/`ResultAsync` chain in `v5-utils`, shared by both hosts. Errors stay
as values end to end — `ZodError | Rejection | GatewayFailure[]`, unified as the
`PipelineError` type — and `resolveError` becomes a pure `Err`-branch mapper.

- **middy is removed entirely.** Its only role was `before` hooks + `onError`,
  both native to a `Result` chain. `@middy/core` is dropped from `v5-aws` and
  `examples/v5`.
- **Hono stays as the router** (and keeps its global stack: cors, csrf,
  compress, logger, …). Only the per-route *middleware pattern* and the
  throw-based `onError` bridge are replaced by a single handler that runs the
  chain and `.match(...)`es it to a response.
- Adoption is **inbound-adapter only.** Domain handlers keep returning union
  values; `runCommand`/`runQuery` lift them into `ResultAsync`, keeping the
  domain sans-I/O and neverthrow-free.
- Each adapter **composes the chain explicitly** with `.map`/`.andThen` over
  small reusable atoms (`parsePayload`, `correlationIdFromHeaders`/
  `causationIdFromHeaders`, `runCommand`/`runQuery`) rather than through
  aggregate helpers. The chain's steps stay visible at the call site, the same
  way the middleware `.use(...)` list did — no `buildCommand`/`buildQuery` or
  `metadataFromHeaders` wrappers to hide them.

Each host package shrinks to thin, host-specific I/O helpers: `v5-aws` and
`v5-hono` now only pull raw request pieces off their native request object and
render a resolved `PipelineOutcome` back to a host response.

## Rationale

### The Domain Was Already Value-Based

`GatewayFailure`/`Rejection` are returned, not thrown. A `Result` chain
expresses that directly; the previous design fought it by re-throwing.

### Deletes the Round-Trip and Its Sharp Edges

`FailureError` and `RejectionError` are gone, along with `resolveError`'s
`try/catch` and its `instanceof`-by-`.name` workaround (needed because
separately-bundled tsup entries produced distinct error classes). The mapper
now discriminates on each value's own `kind`/`instanceof ZodError` tag, which
is immune to that cross-bundle pitfall.

### Unexpected Errors Still Reach the Host Boundary

`runCommand`/`runQuery` use `ResultAsync.fromSafePromise`, so a handler that
rejects *unexpectedly* rejects the promise rather than entering the `Err`
channel. The host's own boundary (Hono `app.onError`, or the Lambda runtime)
still turns it into a 500 — only *expected* errors flow as values.

### Errors Are Handled Consistently Across Hosts

Both hosts now resolve their expected errors inside the route via `.match`,
using the route's own hooks. The Hono shell's per-path `routeHooks` map and its
`resolveError`-based `onError` are gone; `onError` is now a plain 500 fallback.

## Consequences

### Positive

- One dependency removed (`@middy/core`); one added (`neverthrow`).
- `FailureError`, `RejectionError`, and the `parseWithZodSchema` throw-wrapper
  are deleted; `resolveError` is a pure function.
- The `__payload`/`__command` event-mutation casts ("cast once, here") and the
  `WithPayload`/`WithCommand`/`PipelineEnv` machinery are gone — data flows
  through the chain as typed values.
- The shared pipeline lives in one place; host packages are thin adapters.

### Negative

- Introduces railway-oriented (`Result`) style as a required idiom for anyone
  touching the inbound layer.
- The exported surface of `v5-aws`/`v5-hono` changed (helpers instead of
  middleware), and the Lambda handler signature is now `(event) => Promise<…>`.

### Confirmation

`pnpm run lint`, `pnpm run typecheck`, `pnpm run coverage` (100% thresholds),
and `pnpm run check-exports` all pass. The `examples/v5` shell integration
tests assert the same status codes and bodies as before the change (202/400/
404/500 for commands, 200/400/503 for the query).

## Alternatives Considered

### Alternative 1: Push neverthrow Into the Domain Too

Rewrite domain handlers to return `Result<T, Failure>` directly, matching the
`Failure` doc comment literally.

**Rejected (for now) because:** it widens the blast radius across
`handler.ts`/`repository.ts` and couples the sans-I/O domain to a library. The
inbound layer is where the throw/catch bridge actually lived, so lifting there
removes the pain with the smallest change. This remains a future option.

### Alternative 2: Collapse the `v5-aws` Package

With middy gone, `v5-aws` is only a handful of helpers that could fold into
`v5-utils`.

**Rejected because:** the AWS and Hono request/response shapes are genuinely
host-specific, so the package split still carries its weight, and collapsing it
would churn the published export map and the example's imports.

### Alternative 3: Keep the Middleware Frameworks

Leave middy and Hono middleware in place.

**Rejected because:** it retains the value → throw → value round-trip and its
cross-bundle `instanceof` workaround purely to satisfy a framework model the
domain never needed.

## References

- [neverthrow](https://github.com/supermacro/neverthrow)
- ADR-004: Decider Returns Rejection for Business Rule Violations
- `packages/v5/src/module/core/shapes/Failure.ts`
