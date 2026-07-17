import type { Context } from "hono";
import { parseSchema } from "@arts-and-crafts/v5-utils/adapters/inbound";
import type { LoadProjection } from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { ResultAsync } from "neverthrow";
import type { ListMembershipsProjection } from "../../projection.ts";
import { listMembershipsQuery } from "../../query.ts";
import { ListMembershipsHandler } from "../../handler.ts";

export function createListMembershipsHonoHandler(
  store: LoadProjection<
    ListMembershipsProjection,
    ResultAsync<ListMembershipsProjection, GatewayFailure>
  >,
) {
  const handler = new ListMembershipsHandler(store);

  return (c: Context) => {
    return parseSchema(listMembershipsQuery)({ body: c.req.query() })
      .andThen((payload) => handler.handle(payload))
      .match(
        (data) => c.json(data, 200),
        (error) => {
          if (Array.isArray(error)) return c.json({ code: "GATEWAY_FAILURE" }, 503);
          return c.json({ code: error.code, reason: error.reason }, 400);
        },
      );
  };
}
