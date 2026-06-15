import { createOpenMembershipCommand, openMembershipCommandPayload } from "../../command.ts";
import { Hono } from "hono";
import { v7 as uuidv7 } from "uuid";
import { aggregateId } from "@examples/modules/membership/core/domain/AggregateId.ts";
import { sValidator } from "@hono/standard-validator";
import type { OpenMembershipHandler } from "../../handler.ts";

export function createOpenMembershipInboundHonoAdapter(handler: OpenMembershipHandler) {
  const route = new Hono();
  route.post("membership/open", sValidator("json", openMembershipCommandPayload), async (c) => {
    const correlationId = c.req.header("X-Correlation-ID") ?? uuidv7();
    const causationId = c.req.header("X-Request-ID") ?? uuidv7();
    const body = c.req.valid("json");
    const command = createOpenMembershipCommand(
      { ...body, membershipId: aggregateId.parse(uuidv7()) },
      {
        correlationId,
        causationId,
      },
    );
    handler.handle(command).catch(console.error);
    return c.json({ accepted: true, id: command.id }, 202);
  });
  return route;
}
