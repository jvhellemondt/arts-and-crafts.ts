# zod-shapes

> Zod schemas for the v5 wire contracts: the `IntegrationEvent` envelope and its `Metadata`.

## What it is

`createIntegrationEventSchema` builds the wire schema of an
`IntegrationEvent` around a payload schema you supply. The envelope fields
come out as `id`, `type`, `kind`, `timestamp`, `payload`, `metadata`, in that
order. You write only the payload, and a topic's model no longer copies the
envelope by hand.

`MetadataSchema` is the wire shape of `Metadata`. It is the default metadata
and the base to extend when a context needs more fields.

Both describe the event **as it is published**, not as it is held in memory:

| Field               | `IntegrationEvent` interface     | Schema                                           |
| ------------------- | -------------------------------- | ------------------------------------------------ |
| `timestamp`         | epoch milliseconds (`number`)    | ISO-8601 string (`z.iso.datetime()`)             |
| `kind`              | `'integration'`                  | `z.literal('integration')`                       |
| optional metadata   | `tenantId?: string`              | optional **and** nullable (Avro's `null` branch) |
| undeclared metadata | passed through (index signature) | stripped, so `commandId`/`commandType` stay home |

The publisher converts `timestamp` to ISO-8601 before parsing.

`correlationId` and `causationId` are always required. Metadata that loosens
either one (optional, nullable, defaulted, or missing) is rejected twice:
by the type parameter at compile time, and when the schema is built, via
`node:assert`.

Neither schema sets an Avro name or namespace, because those belong to the
topic that uses them. Chain `.meta()` on the result. The metadata record keeps
the name Avro derives from its field (`metadata`).

## Interface

```typescript
export const MetadataSchema: z.ZodObject<{
  correlationId: z.ZodString;
  causationId: z.ZodString;
  tenantId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
  actorId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}>;

export function createIntegrationEventSchema<
  TPayload extends z.ZodType,
  TMetadata extends IntegrationEventMetadataSchema = typeof MetadataSchema,
  TType extends z.ZodType<string> = z.ZodString,
>(parts: {
  payload: TPayload;
  metadata?: TMetadata;
  type?: TType;
}): z.ZodObject<{ id; type: TType; kind; timestamp; payload: TPayload; metadata: TMetadata }>;
```

## Usage

```typescript
import {
  createIntegrationEventSchema,
  MetadataSchema,
} from "@arts-and-crafts/v5-utils/adapters/outbound";

export const AccountEventsSchema = createIntegrationEventSchema({
  payload: z.discriminatedUnion("eventType", [AccountOpenedSchema, AccountClosedSchema]),
  // Optional: extra metadata fields. correlationId/causationId cannot be loosened.
  metadata: MetadataSchema.extend({ brand: z.string() }),
  // Optional: document or narrow the event type. A z.enum becomes an Avro enum.
  type: z.string().meta({ description: "Event type, e.g. 'AccountOpened.v1'." }),
}).meta({ avroName: "AccountEvents", avroNamespace: "com.example.accounts", topic });
```

The result is a plain `z.object`, so `.shape.payload`, `.extend()` and
`z.infer` work as they would on any other object schema.

## Related

- **Tests**: [`IntegrationEvent.schema.test.ts`](../IntegrationEvent.schema.test.ts), [`Metadata.schema.test.ts`](../Metadata.schema.test.ts)
- **Decision**: [ADR-0012](../../../../../v5/docs/adr/0012-integration-event-zod-schema-models-the-wire.md)
