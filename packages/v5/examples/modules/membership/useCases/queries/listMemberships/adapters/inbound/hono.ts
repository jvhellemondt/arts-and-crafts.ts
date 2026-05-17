import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { HandleQuery } from "@useCases/query/capabilities/HandleQuery.ts";
import { isFailure } from "@examples/shared/utils/isFailure.ts";
import { type Context } from "hono";
import { v7 as uuidv7 } from "uuid";
import type { MembershipSummary } from "../../projection.ts";
import { createListMembershipsQuery, type ListMembershipsQuery } from "../../query.ts";
import type { ParsedHonoBody } from "@examples/shared/adapters/inbound/ParsedHonoBody.ts";
import type { listMembershipsQueryPayload } from "../../query.ts";

export class ListMembershipsHonoAdapter {
  constructor(
    private readonly handler: HandleQuery<
      ListMembershipsQuery,
      Promise<MembershipSummary[] | GatewayFailure>
    >,
  ) {}

  async handle(
    c: Context<{}, "memberships", ParsedHonoBody<"query", typeof listMembershipsQueryPayload>>,
  ): Promise<Response> {
    const payload = c.req.valid("query");
    const correlationId = c.req.header("X-Correlation-ID") ?? uuidv7();
    const causationId = c.req.header("X-Request-ID") ?? uuidv7();
    const query = createListMembershipsQuery(payload, { correlationId, causationId });
    const result = await this.handler.handle(query);
    if (isFailure(result)) {
      return c.json({ error: result.reason }, 503);
    }
    return c.json(result, 200);
  }
}
