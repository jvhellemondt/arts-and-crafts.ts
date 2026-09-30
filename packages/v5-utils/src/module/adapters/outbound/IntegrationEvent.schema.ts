import assert from "node:assert";
import * as z from "zod";
import { MetadataSchema, type RequiredMetadata } from "./Metadata.schema.ts";

const REQUIRED_METADATA_KEYS = [
  "correlationId",
  "causationId",
] as const satisfies readonly (keyof RequiredMetadata)[];

const IdSchema = z.string().meta({ description: "Stable id for idempotency." });
const TypeSchema = z.string().meta({ description: "Event type, e.g. 'OrderPlaced.v1'." });
const KindSchema = z.literal("integration").meta({ description: "Always 'integration'." });
const TimestampSchema = z.iso.datetime().meta({ description: "ISO-8601 datetime." });

/**
 * A metadata schema an integration event accepts: an object that requires
 * `correlationId` and `causationId` on both the way in and the way out, so
 * neither can be loosened to optional, nullable or defaulted.
 */
export type IntegrationEventMetadataSchema = z.ZodObject &
  z.ZodType<RequiredMetadata, RequiredMetadata>;

export interface IntegrationEventSchemaParts<
  TPayload extends z.ZodType,
  TMetadata extends IntegrationEventMetadataSchema,
  TType extends z.ZodType<string>,
> {
  /** The event's `payload`, e.g. a `z.discriminatedUnion` of the events on a topic. */
  readonly payload: TPayload;
  /** The event's `metadata`. Defaults to `MetadataSchema`; extend that to add fields. */
  readonly metadata?: TMetadata;
  /** The event's `type`. Defaults to a plain string; override to document the types it takes. */
  readonly type?: TType;
}

/**
 * Builds the wire schema of an `IntegrationEvent` from
 * `@arts-and-crafts/v5/adapters/outbound/shapes` around the given payload:
 * `id`, `type`, `kind`, `timestamp`, `payload`, `metadata`, in that order.
 *
 * It describes the event as it is published, not as it is held in memory:
 * `timestamp` is an ISO-8601 string rather than the interface's epoch
 * milliseconds, and `metadata` is `MetadataSchema` (or an extension of it),
 * which strips domain-internal provenance.
 *
 * The result is a plain `z.object`, so it takes `.meta()` (e.g. for an Avro
 * name, namespace and topic) and `.extend()` like any other object schema.
 * Nothing Avro-specific is set here; the caller owns those names.
 *
 * `correlationId` and `causationId` stay required whatever metadata is passed.
 * The type parameter rejects a schema that loosens either of them, and the
 * same check runs when the schema is built, for callers the compiler cannot
 * see.
 */
export function createIntegrationEventSchema<
  TPayload extends z.ZodType,
  TMetadata extends IntegrationEventMetadataSchema = typeof MetadataSchema,
  TType extends z.ZodType<string> = typeof TypeSchema,
>({
  payload,
  // TypeScript cannot tie a defaulted type parameter to a defaulted argument.
  // Left out, `metadata`/`type` infer nothing, so TMetadata/TType fall back to
  // exactly these defaults, which is what the casts assert.
  metadata = MetadataSchema as unknown as TMetadata,
  type = TypeSchema as unknown as TType,
}: IntegrationEventSchemaParts<TPayload, TMetadata, TType>) {
  const loosened = REQUIRED_METADATA_KEYS.filter((key) => !isRequired(metadata.shape[key]));
  assert(loosened.length === 0, `Integration event metadata must require ${loosened.join(", ")}`);

  return z.object({
    id: IdSchema,
    type,
    kind: KindSchema,
    timestamp: TimestampSchema,
    payload,
    metadata,
  });
}

function isRequired(field: z.ZodType | undefined): boolean {
  return (
    field !== undefined && !field.safeParse(undefined).success && !field.safeParse(null).success
  );
}
