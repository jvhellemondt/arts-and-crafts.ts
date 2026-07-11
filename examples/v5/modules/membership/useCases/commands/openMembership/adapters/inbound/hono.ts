import { createOpenMembershipCommand } from "../../command.ts";
import { Hono } from "hono";
import { v7 as uuidv7 } from "uuid";
import { aggregateId } from "../../../../../core/domain/AggregateId.ts";
import { sValidator } from "@hono/standard-validator";
import type { OpenMembershipHandler } from "../../handler.ts";
import { openMembershipSchema } from "./schema.ts";

export function createOpenMembershipInboundHonoAdapter(handler: OpenMembershipHandler) {
  const route = new Hono();
  route.post("membership/open", sValidator("json", openMembershipSchema), async (c) => {
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
    const result = await handler.handle(command);
    if ("kind" in result && result.kind === "rejection") {
      return c.json({ accepted: false, code: result.code }, 404);
    }
    if (Array.isArray(result) && result.length) {
      return c.json({ code: "UNEXPECTED_SERVER_ERROR" }, 500);
    }
    return c.json({ accepted: true, id: command.payload.membershipId }, 202);
  });
  return route;
}
