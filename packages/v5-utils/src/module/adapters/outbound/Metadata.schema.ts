import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import * as z from "zod";

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

export type RequiredMetadata = Pick<Metadata, "correlationId" | "causationId">;
