# ADR-0007: Inbound Pipeline Uses neverthrow, Not Middleware Frameworks

**Date:** 2026-07-18 (supersedes the 2026-07-14 middy/neverthrow migration)
**Status:** Accepted
**Context:** v5 inbound adapters (`v5-utils`, `v5-aws`, `v5-hono`, `examples/v5`)

## Context

Every inbound route runs the same steps: parse the request body/params, derive
tracing metadata (correlation/causation ids), build a `Command`/`Query`, run the
handler, and render a response — short-circuiting on the first error. Earlier
this was expressed with middleware frameworks (middy on Lambda, Hono middleware)
whose *throw-to-short-circuit* model fought the domain, which already reports
errors as **values** (`Invalid`, `Rejection`, `GatewayFailure[]`, never thrown).
That forced a value → throw → value round-trip purely to satisfy the frameworks.

## Decision

Express the inbound pipeline as a [neverthrow](https://github.com/supermacro/neverthrow)
`Result`/`ResultAsync` chain composed explicitly in each adapter; errors stay as
values end to end and are resolved with a single `.match(...)` to a response.

```ts
ResultAsync.combine([
  parseJsonBody(c).andThen(parseSchema(schema)),   // Invalid on failure
  correlationIdFromHeaders()(c),
  causationIdFromHeaders()(c),
])
  .map(toCommand)
  .andThen((command) => handler.handle(command))    // Decision in Ok, GatewayFailure[] in Err
  .match(onOk, onErr);                               // → 202 / 409 / 400 / 503
```

- **No middleware framework in the pipeline.** middy is removed; Hono remains
  only as the router and global stack (cors, csrf, logger, …). The per-route
  behaviour is one handler that runs the chain.
- **Small reusable atoms, composed at the call site.** `parseJsonBody`,
  `parseSchema`, `correlationIdFromHeaders`/`causationIdFromHeaders` are visible
  steps in the chain — no aggregate `buildCommand` wrapper hides them.
- **Adapter-only.** Domain handlers return `ResultAsync` directly (ADR-0008); the
  adapter calls `handler.handle(...)` and `.match`es. There is no `runCommand`/
  `runQuery` lifting step and no `resolveError` boundary.
- **Errors discriminate on their own tag.** The `Err` branch checks
  `Array.isArray` (a `GatewayFailure[]` → 503) and otherwise reads an `Invalid`
  outcome's `code`/`reason` → 400 (ADR-0009).

## Rationale

- **The domain is value-based; the chain expresses that directly.** No
  re-throwing, no `instanceof`-by-`.name` cross-bundle workaround.
- **Unexpected throws still reach the host boundary.** Only *expected* errors
  flow as values; a genuine bug rejects the promise and the host (Hono
  `app.onError`, or the Lambda runtime) renders a 500.
- **One pipeline shape, two hosts.** `v5-aws` and `v5-hono` shrink to host-
  specific helpers (pull request pieces, render a response); the shape is shared.

## Consequences

- Railway-oriented style is a required idiom for anyone touching the inbound
  layer.
- `@middy/core` is gone; `neverthrow` is the one dependency the inbound adapters
  rely on.

## Alternatives Considered

- **Push neverthrow into the domain too** — later done for the outbound/handler
  layer (ADR-0008); the inbound layer is where the throw/catch bridge lived, so
  it moved first.
- **Collapse `v5-aws` into `v5-utils`** — rejected; AWS vs. Hono request/response
  shapes are genuinely host-specific.
- **Keep the middleware frameworks** — rejected; retains the value → throw →
  value round-trip the domain never needed.

## References

- ADR-0003: Command Handling
- ADR-0008: Outbound Ports Return ResultAsync
- ADR-0009: Outcome Taxonomy — Rejection / Failure / Invalid
