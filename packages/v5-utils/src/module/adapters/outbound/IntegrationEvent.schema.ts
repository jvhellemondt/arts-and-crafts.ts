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

export type IntegrationEventMetadataSchema = z.ZodObject &
  z.ZodType<RequiredMetadata, RequiredMetadata>;

export interface IntegrationEventSchemaParts<
  TPayload extends z.ZodType,
  TMetadata extends IntegrationEventMetadataSchema,
  TType extends z.ZodType<string>,
> {
  readonly payload: TPayload;
  readonly metadata?: TMetadata;
  readonly type?: TType;
}

export function createIntegrationEventSchema<
  TPayload extends z.ZodType,
  TMetadata extends IntegrationEventMetadataSchema = typeof MetadataSchema,
  TType extends z.ZodType<string> = typeof TypeSchema,
>({
  payload,
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
