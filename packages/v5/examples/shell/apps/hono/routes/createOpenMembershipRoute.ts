import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import { aggregateId } from "@examples/modules/membership/core/domain/AggregateId.ts";
import { v7 as uuidv7 } from "uuid";
import type { OpenMembershipHonoAdapter } from "@examples/modules/membership/useCases/commands/openMembership/adapters/inbound/hono.ts";
import { openMembershipCommandPayload } from "@examples/modules/membership/useCases/commands/openMembership/command.ts";

export function createOpenMembershipRoute(adapter: OpenMembershipHonoAdapter) {
  const route = new Hono();
  route.post("membership/open", sValidator("json", openMembershipCommandPayload), async (c) => {
    const id = aggregateId.parse(uuidv7());
    adapter.handle(c, id).catch(console.error);
    return c.json({ accepted: true, id }, 202);
  });
  return route;
}
