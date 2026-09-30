# ADR-0012: IntegrationEvent Zod Schema Models the Wire, Built by a Factory

**Date:** 2026-09-11
**Status:** Accepted
**Context:** v5 integration events published to a broker (`packages/v5-utils`)

## Context

A topic's message model (for example one that generates an Avro schema from
Zod) had to copy the `IntegrationEvent` envelope and `Metadata` by hand. Every
further topic would copy them again, and the copies could drift. We wanted one
Zod schema for the envelope in `v5-utils` that makes the payload and the
metadata easy to plug in.

Two properties of the surrounding tooling shaped the design:

- Zod-to-Avro converters cannot map `z.unknown()`, so a base schema with a
  placeholder payload cannot be converted on its own.
- In Zod 4, `.extend()` and shape spreading drop object-level `.meta()` but
  keep field-level `.meta()`. A shared base therefore passes its field
  descriptions on, but never its Avro names.

## Decision

`createIntegrationEventSchema({ payload, metadata?, type? })` in
`@arts-and-crafts/v5-utils/adapters/outbound` builds the envelope.
`MetadataSchema` sits next to it and is the default metadata. Both model the
**wire** format: an ISO-8601 `timestamp`, nullable optionals and stripped
undeclared keys. The `IntegrationEvent` interface stays the in-memory shape,
and publishers convert between the two.

`correlationId` and `causationId` are always required. The `metadata` type
parameter only accepts schemas that require both on input and output, and the
factory repeats the check at runtime.

## Rationale

- **The payload is a required argument**, so no topic can forget it. A base
  schema with `.extend()` compiles without one, and the gap only shows up when
  the Avro is generated.
- **Metadata extends in one move**: `metadata: MetadataSchema.extend({...})`.
- **It stays plain Zod**: the result is a `z.object`, so `.meta()`,
  `.shape.payload` and `.extend()` behave as before.
- **No Avro names are set in the shared schemas**, so a generated Avro schema
  keeps the names its topic gives it; the metadata record takes its name from
  the field holding it.

## Consequences

### Positive

- One definition of the envelope and metadata for every v5 topic.
- Loosening the tracing ids is a compile error, not a runtime surprise.

### Negative

- More of `v5-utils` now relies on `zod` (already a peer dependency for
  `parseSchema`). The `v5` core stays free of it.
- The factory's generic defaults need a cast, because TypeScript cannot tie a
  defaulted type parameter to a defaulted argument.
- Passing `type: z.enum([...])` turns the Avro field into an enum. This is
  documented, but it is easy to miss.

## Alternatives Considered

- **Base schema plus `.extend()`**: the simplest, but the payload is a
  `z.unknown()` placeholder that compiles when forgotten.
- **Exported shape fragments to spread**: fastest for `tsc`, but nothing
  enforces the envelope, and a missing payload generates Avro without one.
- **A Zod codec for `timestamp`** (epoch ms ↔ ISO): Zod-to-Avro converters read
  a pipe's output type, so it would emit `double` instead of `string`.

## References

- [zod-shapes docs](../../../v5-utils/src/module/adapters/outbound/docs/zod-shapes.md)
- ADR-0006: Domain and Integration Events, Event Relay, and Checkpoints
