# ADR-0001: Modular Functional-Core / Imperative-Shell Folder Structure

**Date:** 2026-07-18
**Status:** Accepted
**Context:** v5 library (`packages/v5`) and reference module (`examples/v5`)

## Context

v5 is a CQRS/event-sourced toolkit plus a reference module. We needed a layout
that keeps decision logic pure and testable, isolates I/O at the edges, and
groups code by feature rather than by technical layer, so a use case can be read
end to end in one folder.

## Decision

Organise around **Functional Core / Imperative Shell (FCIS)**, modular by
feature. The library (`packages/v5`) is sans-I/O; the reference module and shell
(`examples/v5`) supply the concrete adapters.

```
packages/v5/src/module/
  core/           shapes/ (Message, DomainEvent, Intent, Outcome, …)  capabilities/ (sans-I/O ports)
  useCases/       command/ query/ policy/  → each: capabilities/ + shapes/
  adapters/outbound/  capabilities/ (ports) + shapes/ (GatewayFailure, StoredEvent, …)

examples/v5/
  modules/<module>/core/       domain/ events/ intents/ anchors.ts
  modules/<module>/useCases/commands/<useCase>/   command decide decision handler
                                                   specifications/ rejections/ adapters/inbound/
  modules/<module>/useCases/queries/<useCase>/    query handler projection projector
  modules/<module>/useCases/policies/<useCase>/   handler
  modules/<module>/adapters/outbound/relays/      events/ intents/
  shell/    apps/hono/ apps/lambda/ main.ts       shared/  adapters/outbound/ utils/
```

Ports are expressed as capability **interfaces generic over their return type**
(`LoadProjection<TState, TResult>`, `Decide<TCommand, TState, TEvent>`), so the
library never commits to `Promise`, `ResultAsync`, or any I/O library.

## Rationale

- **Sans-I/O core.** `core/` and the `useCases/*/capabilities` describe *what*
  without *how*; they import no transport, DB, or `neverthrow` types, so the
  domain is trivially unit-testable and reusable across runtimes.
- **Ports as generic capabilities.** A single interface serves every host — the
  example instantiates `TResult = ResultAsync<…, GatewayFailure>` (ADR-0008)
  without the library depending on neverthrow.
- **Screaming architecture.** A use case is a folder: its command, decider,
  decision, specifications, rejections, and inbound adapters sit together, so
  intent is legible without touching sibling features.

## Consequences

- Adding a use case means adding a folder, not editing shared layer files.
- The library is publishable independently of any transport or persistence.
- The generic `TResult` on every port adds a type parameter to read past, in
  exchange for host-independence.

## References

- Gary Bernhardt, *Boundaries* (Functional Core, Imperative Shell)
- ADR-0007: Inbound Pipeline Uses neverthrow
- ADR-0008: Outbound Ports Return ResultAsync
