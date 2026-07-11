import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { HandleQuery } from "@useCases/query/capabilities/HandleQuery.ts";
import { isFailure } from "@examples/shared/utils/isFailure.ts";
import { v7 as uuidv7 } from "uuid";
import type { MembershipSummary } from "../../projection.ts";
import { createListMembershipsQuery, type ListMembershipsQuery } from "../../query.ts";
import { listMembershipsQueryPayload } from "../../query.ts";
import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";

export function createListMembershipsInboundHonoAdapter(
  handler: HandleQuery<ListMembershipsQuery, Promise<MembershipSummary[] | GatewayFailure>>,
) {
  const route = new Hono();
  route.get("memberships", sValidator("query", listMembershipsQueryPayload), async (c) => {
    const payload = c.req.valid("query");
    const correlationId = c.req.header("X-Correlation-ID") ?? uuidv7();
    const causationId = c.req.header("X-Request-ID") ?? uuidv7();
    const query = createListMembershipsQuery(payload, { correlationId, causationId });
    const result = await handler.handle(query);
    if (isFailure(result)) {
      return c.json({ error: result.reason }, 503);
    }
    return c.json(result, 200);
  });
  return route;
}
