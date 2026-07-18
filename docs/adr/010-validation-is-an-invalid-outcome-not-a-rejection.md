# ADR-010: Validation Is an `Invalid` Outcome; Outcomes Share an `Outcome` Base

**Date:** 2026-07-18
**Status:** Accepted
**Context:** v5 inbound pipeline and error taxonomy (`packages/v5`, `packages/v5-utils`, `packages/v5-hono`, `packages/v5-aws`, `examples/v5`)

## Context

The codebase modelled two kinds of non-success outcome, each a first-class
value with a runtime `kind` tag:

- **`Rejection`** (`kind: "rejection"`) — a valid request the domain declined
  (ADR-001, ADR-004). Lives in the Ok channel for command decisions (ADR-009).
- **`Failure`** (`kind: "failure"`) — an unexpected, infrastructure-level fault,
  specialised by `GatewayFailure` in the outbound adapter layer.

Input validation had no home of its own, so it borrowed `Rejection`:

- `parseSchema` returned a `Rejection` with `code: "PARSE_FAILED"`, and
  `Rejection` had grown a `validationErrors?` field to carry the schema issues —
  a field that only ever made sense for validation.
- `parseJsonBody` returned an ad-hoc `{ name: "NoBodyError" | "JSONParseError";
  message }` shape that was neither a `Rejection` nor a `Failure`, and the
  command adapters had a dedicated `.match` branch just for it.

This conflated two different things. A `Rejection` means *the domain understood
a well-formed request and said no* (→ 409). A malformed request is the opposite:
it never conformed to the contract, so the domain was never engaged (→ 400). The
`validationErrors` field bolted onto `Rejection` was the visible smell — it
described *how the input failed to parse*, which is not a property of a domain
decision. `Failure` was not the right home either: it is documented as *always
unexpected* and *outside the domain's control* (→ 503), whereas a bad request is
expected and client-caused.

## Decision

Introduce a third first-class outcome, `Invalid`, and factor the shared
structure of all three into an `Outcome` base.

```ts
// core/shapes/Outcome.ts — shared { code, reason }, no kind of its own
export interface Outcome<TCode = string> {
  readonly code: TCode;
  readonly reason: string;
}

export interface Rejection<TCode = string> extends Outcome<TCode> {
  readonly kind: "rejection"; // valid request the domain declined  → 409/422
}
export interface Failure<TCode = string> extends Outcome<TCode> {
  readonly kind: "failure";   // unexpected infrastructure fault     → 503/500
  readonly cause?: unknown;
}
export interface Invalid<TCode = string> extends Outcome<TCode> {
  readonly kind: "invalid";   // malformed request                   → 400/422
  readonly validationErrors?: { code: string; field?: string; message?: string; expected?: string }[];
}
```

- **`validationErrors` moves from `Rejection` to `Invalid`.** It is the field
  that describes how input failed to conform, so it belongs to the only outcome
  that is about non-conformance.
- **`parseSchema` returns `Invalid`** (`code: "PARSE_FAILED"`).
- **`parseJsonBody` (both `v5-hono` and `v5-aws`) returns `Invalid`** —
  `code: "NO_BODY"` for an absent body, `code: "MALFORMED_JSON"` for unparseable
  JSON — so every inbound boundary error is now the same shape.
- **`GatewayFailure` is unchanged.** It remains `Failure & { code:
  "GATEWAY_FAILURE"; gateway }` in the outbound adapter layer; its fields now
  flow through `Outcome`.

## Rationale

### Three semantic categories, three responses

Validation, domain rejection, and infrastructure failure are genuinely
different concerns that map to different HTTP families: **`Invalid` → 400**
(malformed), **`Rejection` → 409/422** (the domain declined), **`Failure` →
503/500** (something broke). Giving each its own `kind` lets an adapter map them
without guessing, and stops any one concept from impersonating another.

### The shared base removes duplication, not distinction

`Rejection`, `Failure`, and `Invalid` all carry `{ code, reason }`. `Outcome`
factors that out so the three stop repeating it, while the `kind` tag and the
per-variant fields (`cause` on `Failure`, `validationErrors` on `Invalid`) keep
them distinct. Because they are a tagged union, narrowing on `kind` yields the
right fields — `validationErrors` exists inside `kind === "invalid"` and is a
type error on a `Failure`. Collapsing the three into one loosely-typed `Outcome`
with every extra field optional was rejected (see Alternatives) precisely
because it would give that safety away.

### Two different axes

`Rejection` vs `Failure` vs `Invalid` is a **semantic-kind** split. `Failure`
vs `GatewayFailure` is a **layer** split — the sans-I/O `core` base versus its
I/O-aware adapter specialisation (ADR-009). They compose: `Failure` extends
`Outcome` in `core`; `GatewayFailure` still specialises `Failure` in the
adapter layer. Validation being a boundary concern is why `Invalid` is produced
only by the inbound adapters, never by the domain.

## Consequences

### Positive

- Every inbound boundary error is a single shape (`Invalid`); the command
  adapters' error `.match` collapses from three branches to two
  (`GatewayFailure[]` → 503, otherwise `Invalid` → 400).
- `Rejection` regains its precise meaning — a domain decision — and no longer
  carries a validation-only field.
- `Outcome` gives one place to describe the common `{ code, reason }` shape and
  a natural home for a future `Outcome` union or shared guards.

### Negative

- Touches `core` shapes, both transport packages, the command adapters, and
  their tests.
- `parseJsonBody`'s error `code`s changed from the old error *names*:
  `NoBodyError` → `NO_BODY`, `JSONParseError` → `MALFORMED_JSON`. Any host that
  keyed off the previous strings must update.

### Confirmation

`pnpm run typecheck`, `pnpm run lint`, `pnpm run fmt:check`, `pnpm run coverage`,
and `pnpm run check-exports` all pass; the example suite is green.

## Alternatives Considered

### Alternative 1: Keep validation as a `Rejection` (status quo)

Leave `parseSchema` returning `kind: "rejection"` with `validationErrors`.

**Rejected because:** it conflates a malformed request with a domain decision.
The `validationErrors` field on `Rejection` was the tell — a domain rejection
has no schema issues to report. It quietly erodes the concept that ADR-001 and
ADR-004 were precise about.

### Alternative 2: Model validation as a `Failure`

Return `kind: "failure"` for schema/body errors.

**Rejected because:** `Failure` is defined as *always unexpected* and *outside
the domain's control*, and `GatewayFailure` maps to 503. A malformed request is
expected, client-caused, and a 400 — the opposite of an infrastructure fault.

### Alternative 3: Keep validation out of the domain error model entirely

"Parse, don't validate": handle a parse failure at the boundary and map it to
400 there, so it never enters the shared outcome types at all (the type would
live in the adapter layer, not `core`).

**Rejected for now because:** we chose to keep validation as a first-class value
flowing on the neverthrow rail alongside the other outcomes, which keeps the
adapters uniform (`parseSchema`/`parseJsonBody`/handler all feed one `.match`).
It remains a reasonable alternative if the domain error model should be provably
just `Rejection | Failure`.

### Alternative 4: One `Outcome` type with a free `kind` and all-optional fields

`interface Outcome { kind: "rejection" | "failure" | "invalid"; code; reason;
validationErrors?; cause? }`.

**Rejected because:** it re-introduces the original smell — a `Failure` could
carry `validationErrors`, TypeScript would not stop it, and there is no
exhaustiveness checking. Three tagged variants over a shared base keep each
field where it is meaningful.

## References

- ADR-001: Rejection is Not a Domain Event
- ADR-004: Decider Returns Rejection for Business Rule Violations
- ADR-008: Inbound Pipeline Uses neverthrow Instead of Middleware Frameworks
- ADR-009: Outbound Ports Return ResultAsync; Rejection Stays in the Ok Channel
- `packages/v5/src/module/core/shapes/Outcome.ts`, `Rejection.ts`, `Failure.ts`, `Invalid.ts`
- [Alexis King: Parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)
