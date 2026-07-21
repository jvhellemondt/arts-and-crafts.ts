# Architecture Decision Records

Architecture Decision Records (ADRs) for `packages/v5` — the v5 CQRS /
event-sourcing toolkit and its reference module (`examples/v5`).

> The v4 ADRs live alongside the v4 package at
> [`packages/v4/docs/adr`](../../../v4/docs/adr/README.md).

## What is an ADR?

An ADR captures a significant architectural decision, the context that led to
it, the alternatives considered, and the consequences of the choice — so future
maintainers understand **why** the code is shaped the way it is.

## Format

A lightweight Markdown format inspired by [MADR](https://adr.github.io/madr/):
**Date**, **Status**, **Context**, **Decision**, **Rationale**, **Consequences**,
**Alternatives Considered**, **References**. `0000` holds the fuller MADR
template.

## Index

These ADRs describe the current TypeScript v5 implementation. (An earlier
Rust-oriented design set, `0001`–`0013`, was superseded by this consolidated,
one-ADR-per-topic set.)

- [ADR-0000: MADR Template for ADR](./0000-madr-template-for-adr.md)
- [ADR-0001: Modular Functional-Core / Imperative-Shell Folder Structure](./0001-modular-fcis-folder-structure.md)
- [ADR-0002: Runtime and Shell Model](./0002-runtime-and-shell-model.md)
- [ADR-0003: Command Handling — Pure Decider, Specifications, and Decision](./0003-command-handling.md)
- [ADR-0004: Query and Projection Handling](./0004-query-and-projection-handling.md)
- [ADR-0005: Intents, Outbox, and Intent Relay](./0005-intents-outbox-and-intent-relay.md)
- [ADR-0006: Domain and Integration Events, Event Relay, and Checkpoints](./0006-domain-and-integration-events-and-event-relay.md)
- [ADR-0007: Inbound Pipeline Uses neverthrow, Not Middleware Frameworks](./0007-inbound-pipeline-uses-neverthrow.md)
- [ADR-0008: Outbound Ports Return ResultAsync; Rejection Stays in the Ok Channel](./0008-outbound-ports-return-resultasync.md)
- [ADR-0009: Outcome Taxonomy — Rejection / Failure / Invalid Share an Outcome Base](./0009-outcome-taxonomy-rejection-failure-invalid.md)
- [ADR-0010: Events and Intents Persist Atomically via a Transactional Writer](./0010-events-and-intents-persist-atomically.md)

## Contributing

When making a significant architectural decision: copy the shape of an existing
ADR, fill in every section (especially Rationale and Alternatives Considered),
number sequentially, add it to the index above, and keep one ADR per topic.

## References

- [MADR: Markdown Architectural Decision Records](https://adr.github.io/madr/)
- [Architecture Decision Records (Backstage)](https://backstage.io/docs/architecture-decisions)
