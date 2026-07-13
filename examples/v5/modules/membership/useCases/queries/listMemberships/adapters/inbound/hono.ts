import { createFactory } from "hono/factory";
import type { PipelineEnv } from "@arts-and-crafts/v5-hono";
import {
  parseQueryMiddleware,
  correlationIdMiddleware,
  causationIdMiddleware,
  toQueryMiddleware,
} from "@arts-and-crafts/v5-hono";
import { runQuery } from "@arts-and-crafts/v5-utils/useCases/query";
import type { LoadProjection } from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { ListMembershipsProjection } from "../../projection.ts";
import {
  createListMembershipsQuery,
  listMembershipsQueryPayload,
  type ListMembershipsQuery,
} from "../../query.ts";
import { ListMembershipsHandler } from "../../handler.ts";

const factory = createFactory<PipelineEnv>();

export function createListMembershipsHonoHandler(store: LoadProjection<ListMembershipsProjection>) {
  const handler = new ListMembershipsHandler(store);

  return factory.createHandlers(
    parseQueryMiddleware(listMembershipsQueryPayload),
    correlationIdMiddleware(),
    causationIdMiddleware(),
    toQueryMiddleware(createListMembershipsQuery),
    async (c) => {
      const data = await runQuery(c.get("query") as ListMembershipsQuery, handler);
      return c.json(data, { status: 200 });
    },
  );
}
