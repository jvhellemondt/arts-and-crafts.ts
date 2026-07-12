import type { Context } from "hono";
import { v7 as uuidv7 } from "uuid";
import type { PipelineEnv } from "@arts-and-crafts/v5-hono";
import {
  parseJsonBodyMiddleware,
  correlationIdMiddleware,
  causationIdMiddleware,
} from "@arts-and-crafts/v5-hono";
import { runCommand } from "@arts-and-crafts/v5-utils/useCases/command";
import { aggregateId } from "@examples/modules/membership/core/domain/AggregateId.ts";
import { createOpenMembershipCommand } from "../../command.ts";
import type { OpenMembershipHandler } from "../../handler.ts";
import { openMembershipSchema, type OpenMembershipSchemaPayload } from "./schema.ts";

export const openMembershipHonoMiddleware = [
  parseJsonBodyMiddleware(openMembershipSchema),
  correlationIdMiddleware(),
  causationIdMiddleware(),
];

export function createOpenMembershipHonoHandler(handler: OpenMembershipHandler) {
  return async (c: Context<PipelineEnv>) => {
    const command = await runCommand(
      (payload: OpenMembershipSchemaPayload, metadata) =>
        createOpenMembershipCommand(
          { ...payload, membershipId: aggregateId.parse(uuidv7()) },
          metadata,
        ),
      handler,
    )(c.get("payload") as OpenMembershipSchemaPayload, {
      correlationId: c.get("correlationId"),
      causationId: c.get("causationId"),
    });
    return c.json({ accepted: true, id: command.payload.membershipId }, { status: 202 });
  };
}
