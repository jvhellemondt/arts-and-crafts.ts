import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import * as z from "zod";

/**
 * Wire shape of `Metadata` from `@arts-and-crafts/v5/core/shapes`: the tracing
 * envelope every integration event carries. Add context-specific fields with
 * `MetadataSchema.extend({ ... })` and hand the result to
 * `createIntegrationEventSchema`.
 *
 * It departs from the interface in two ways, both wire concerns:
 *
 * - Optional fields are also nullable, because Avro models an absent value as
 *   the `null` branch of a union.
 * - Keys the schema does not declare are stripped rather than passed through,
 *   so domain-internal provenance (`commandId`/`commandType` on `DomainEvent`)
 *   never reaches the wire.
 *
 * It carries no Avro name or namespace: an Avro record generated from it takes
 * its name from the field holding it (`metadata`).
 */
export const MetadataSchema = z.object({
  correlationId: z
    .string()
    .meta({ description: "Correlates a flow across services (end-to-end)." }),
  causationId: z.string().meta({
    description: "Generic tracing pointer to the immediate cause (often previous message id).",
  }),
  tenantId: z
    .string()
    .optional()
    .nullable()
    .meta({ description: "Tenant identifier for multi-tenant systems." }),
  actorId: z
    .string()
    .optional()
    .nullable()
    .meta({ description: "Actor or user responsible for the change." }),
});

/** The metadata fields no integration event may go without. */
export type RequiredMetadata = Pick<Metadata, "correlationId" | "causationId">;
