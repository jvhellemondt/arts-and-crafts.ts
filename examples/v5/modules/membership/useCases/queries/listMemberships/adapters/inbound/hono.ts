import type { Context } from "hono";
import { causationIdFromHeaders, correlationIdFromHeaders } from "@arts-and-crafts/v5-hono";
import { parseSchema } from "@arts-and-crafts/v5-utils/adapters/inbound";
import type { LoadProjection } from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import { ResultAsync } from "neverthrow";
import type { ListMembershipsProjection } from "../../projection.ts";
import { createListMembershipsQuery, listMembershipsQueryPayload } from "../../query.ts";
import { ListMembershipsHandler } from "../../handler.ts";

export function createListMembershipsHonoHandler(
  store: LoadProjection<
    ListMembershipsProjection,
    ResultAsync<ListMembershipsProjection, GatewayFailure>
  >,
) {
  const handler = new ListMembershipsHandler(store);

  return (c: Context) => {
    return ResultAsync.combine([
      parseSchema(listMembershipsQueryPayload)({ body: c.req.query() }),
      correlationIdFromHeaders()(c),
      causationIdFromHeaders()(c),
    ])
      .map(([payload, ...metadata]) => ({
        payload,
        metadata: metadata.reduce((acc, value) => Object.assign(acc, value), {}) as Metadata,
      }))
      .map(({ payload, metadata }) => createListMembershipsQuery(payload, metadata))
      .andThen((query) => handler.handle(query))
      .match(
        (data) => c.json(data, 200),
        (error) => {
          if (Array.isArray(error)) return c.json({ code: "GATEWAY_FAILURE" }, 503);
          return c.json({ code: error.code, reason: error.reason }, 400);
        },
      );
  };
}
