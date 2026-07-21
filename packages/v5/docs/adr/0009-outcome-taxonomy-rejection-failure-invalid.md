# ADR-0009: Outcome Taxonomy — Rejection / Failure / Invalid Share an `Outcome` Base

**Date:** 2026-07-18
**Status:** Accepted
**Context:** v5 error taxonomy (`packages/v5` core shapes, inbound adapters)

## Context

v5 modelled two non-success outcomes, each a value with a runtime `kind` tag:
`Rejection` (`kind: "rejection"`) — a valid request the domain declined
(ADR-0003, kept in the Ok channel per ADR-0008) — and `Failure`
(`kind: "failure"`) — an unexpected infrastructure fault, specialised by
`GatewayFailure` in the outbound layer.

Input validation had no home, so it borrowed `Rejection`: `parseSchema` returned
a `Rejection` with `code: "PARSE_FAILED"`, and `Rejection` had grown a
`validationErrors?` field that only made sense for validation. `parseJsonBody`
returned an ad-hoc `{ name, message }` shape that was neither. This conflated a
malformed request (never reached the domain → 400) with a domain decision on a
valid request (→ 409), and with an infrastructure fault (→ 503).

## Decision

Introduce a third outcome, `Invalid`, and factor the shared structure of all
three into an `Outcome` base.

```ts
export interface Outcome<TCode = string> {          // shared { code, reason }, no kind
  readonly code: TCode;
  readonly reason: string;
}
export interface Rejection<TCode = string> extends Outcome<TCode> {
  readonly kind: "rejection";   // valid request the domain declined  → 409
}
export interface Failure<TCode = string> extends Outcome<TCode> {
  readonly kind: "failure";     // unexpected infrastructure fault     → 503
  readonly cause?: unknown;
}
export interface Invalid<TCode = string> extends Outcome<TCode> {
  readonly kind: "invalid";     // malformed request                   → 400
  readonly validationErrors?: { code: string; field?: string; message?: string; expected?: string }[];
}
```

- **`validationErrors` moves from `Rejection` to `Invalid`** — the only outcome
  about non-conformance.
- **`parseSchema` returns `Invalid`** (`PARSE_FAILED`); **`parseJsonBody`
  (`v5-hono`/`v5-aws`) returns `Invalid`** (`NO_BODY` / `MALFORMED_JSON`), so
  every inbound boundary error is one shape and the command adapter's error
  `.match` collapses from three branches to two.
- **`GatewayFailure` is unchanged** — still `Failure & { code: "GATEWAY_FAILURE";
  gateway }` in the outbound layer; its fields now flow through `Outcome`.

## Rationale

- **Three semantic categories, three responses.** `Invalid` → 400, `Rejection` →
  409, `Failure` → 503. Each has its own `kind`, so no concept impersonates
  another and adapters map without guessing.
- **The base removes duplication, not distinction.** All three share
  `{ code, reason }`; `Outcome` factors that out while `kind` and the per-variant
  fields (`cause`, `validationErrors`) keep them a discriminated union — narrowing
  on `kind` yields exactly the right fields.
- **Two axes.** `Rejection`/`Failure`/`Invalid` is a *kind* split; `Failure` vs.
  `GatewayFailure` is a *layer* split (sans-I/O core base vs. I/O-aware adapter
  specialisation, ADR-0008). They compose: `Failure extends Outcome` in core;
  `GatewayFailure` specialises `Failure` in the adapter layer.

## Consequences

- Every inbound boundary error is an `Invalid`; `Rejection` regains its precise
  meaning (a domain decision) and no longer carries a validation-only field.
- `parseJsonBody`'s error `code`s changed from the old names: `NoBodyError` →
  `NO_BODY`, `JSONParseError` → `MALFORMED_JSON`.

## Alternatives Considered

- **Keep validation as a `Rejection`** — rejected; conflates a malformed request
  with a domain decision (the `validationErrors` field on `Rejection` was the
  tell).
- **Model validation as a `Failure`** — rejected; `Failure` is *always
  unexpected* and maps to 503, the opposite of an expected client 400.
- **Keep validation out of the outcome types** ("parse, don't validate") —
  reasonable, but rejected for now; we keep it a first-class value on the rail so
  adapters stay uniform.
- **One `Outcome` with a free `kind` and all-optional fields** — rejected;
  re-introduces the smell (a `Failure` could carry `validationErrors`) and loses
  exhaustiveness.

## References

- ADR-0003: Command Handling (rejection is a first-class outcome)
- ADR-0007: Inbound Pipeline Uses neverthrow
- ADR-0008: Outbound Ports Return ResultAsync
- Alexis King, *Parse, Don't Validate*
