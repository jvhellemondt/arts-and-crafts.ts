# Design: Per-Concept Documentation for `@arts-n-crafts/ts` v4

**Date**: 2026-02-19
**Status**: Approved

---

## Problem

The `packages/v4` library has no inline documentation. New users — and future
maintainers — have no way to understand what each component does, why it exists,
or how it fits into the broader architecture without reading the source code.

## Goal

Generate one Markdown doc per concept (and per utility) in the v4 package,
co-located with the source in a `docs/` subfolder per layer. Update the root
`README.md` to serve as a navigation hub and feature-building guide covering
both CQRS and EDA paths.

---

## Key Decisions

### 1. Scope: v4 only

v3 is stable and maintenance-only. All documentation effort goes into v4.

### 2. File location: `docs/` subfolder per layer

Docs live close to the source but are not mixed in with `.ts` files:

| Layer | Path pattern |
|-------|-------------|
| Utils | `packages/v4/src/utils/{name}/docs/{name}.md` |
| Core types | `packages/v4/src/core/docs/types/{TypeName}.md` |
| Core concepts | `packages/v4/src/core/docs/{ConceptName}.md` |
| Domain | `packages/v4/src/domain/docs/{ConceptName}.md` |
| Infrastructure | `packages/v4/src/infrastructure/docs/{ConceptName}.md` |

### 3. Doc template: Hybrid (reference + guide)

Each doc follows this structure:

```markdown
# ConceptName

> One-sentence summary.

## What it is

1–2 paragraphs on purpose and architecture role.
Mention relevant patterns where applicable: CQRS, DDD, EDA, hexagonal /
clean architecture, vertical slices, sans-I/O, SOLID.

## Interface

\`\`\`typescript
// Key exported type / interface signature
\`\`\`

## Usage

\`\`\`typescript
// Pulled from examples/ files; inline if no example exists
\`\`\`

## Diagram  ← only where it genuinely clarifies flow

\`\`\`mermaid
// sequence / state / flowchart as appropriate
\`\`\`

## Related

- **Examples**: links to example files
- **Tests**: links to .test.ts files
- **Utils**: links to factory / guard utilities
- **Used by**: links to dependent concept docs
```

### 4. Architecture scope

The "What it is" section must reflect the full breadth of architectural
patterns this library embodies:

- CQRS (Commands, Queries, Buses)
- Domain-Driven Design (AggregateRoot, Repository, Specification, DomainEvent)
- Event Sourcing / Event-Driven Architecture (Decider, EventStore, Outbox, EventBus)
- Hexagonal / Ports & Adapters (interface-first design; Simple* and Resulted* implementations)
- Clean Architecture (layer separation: core → domain → infrastructure)
- Vertical Slices (features cohesive across layers rather than technical layers)
- Sans-I/O (pure functions in core/domain; I/O only at the infrastructure boundary)
- SOLID principles throughout

### 5. Documentation order: leaf → root

Start with components that have no internal imports; work up to those that
depend on others. This ensures that "Used by" links in Related sections
always point to already-written docs.

**Wave 0** — Standalone utilities (no internal imports):
`fail`, `invariant`, `isEqual`, `parseAsError`, `StreamKey`, `makeStreamKey`

**Wave 1** — Core types and factory/guard functions:
`BaseMetadata`, `ISODateTime`, `UnixTimestamp`, `WithIdentifier`, `FilledArray`,
`Maybe`, `Nullable`, `Primitive`, `createCommand`, `isCommand`, `createQuery`,
`isQuery`, `getTimestamp`

**Wave 2** — Core CQRS primitives: `Command`, `Query`

**Wave 3** — Event types + their factories/guards:
`DomainEvent`, `Rejection`, `IntegrationEvent`, `ExternalEvent` and all
`create*` / `is*` / `convert*` / `map*` functions

**Wave 4** — Handler contracts: `CommandHandler`, `QueryHandler`, `EventHandler`

**Wave 5** — Domain building blocks:
`AggregateRoot`, `Repository`, `Specification`, `Decider`

**Wave 6** — Infrastructure interfaces:
`CommandBus`, `QueryBus`, `EventBus`, `EventStore`, `StoredEvent`,
`Outbox`, `OutboxEntry`, `OutboxWorker`, `Database`

**Wave 7** — Implementations:
`Simple*`, `Resulted*`, `InMemoryOutbox`, `GenericOutboxWorker`

**Wave 8** — Integration point: `ScenarioTest`

### 6. One doc at a time, user reviews each

After each doc is written, the user reviews it before the next one is started.
This allows for course-correction early in the process.

### 7. Root README additions (after all concept docs)

Append to `/README.md`:
1. **Concepts index** — table linking all concept docs by layer
2. **How to build features** — CQRS path and EDA/Event Sourcing path, each
   with a Mermaid flow diagram
3. **Architecture principles** — callout box referencing which concepts
   embody hexagonal, clean, vertical slices, sans-I/O, SOLID
