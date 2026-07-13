import { createFactory } from "hono/factory";
import type { PipelineEnv } from "@arts-and-crafts/v5-hono";
import {
  parseQueryMiddleware,
  correlationIdMiddleware,
  causationIdMiddleware,
} from "@arts-and-crafts/v5-hono";
import { runQuery } from "@arts-and-crafts/v5-utils/useCases/query";
import type { LoadProjection } from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { ListMembershipsProjection } from "../../projection.ts";
import {
  createListMembershipsQuery,
  listMembershipsQueryPayload,
  type ListMembershipsQueryPayload,
} from "../../query.ts";
import { ListMembershipsHandler } from "../../handler.ts";

const factory = createFactory<PipelineEnv>();

export function createListMembershipsHonoHandler(store: LoadProjection<ListMembershipsProjection>) {
  const handler = new ListMembershipsHandler(store);

  return factory.createHandlers(
    parseQueryMiddleware(listMembershipsQueryPayload),
    correlationIdMiddleware(),
    causationIdMiddleware(),
    async (c) => {
      const run = runQuery(createListMembershipsQuery, handler);
      const data = await run(c.get("payload") as ListMembershipsQueryPayload, {
        correlationId: c.get("correlationId"),
        causationId: c.get("causationId"),
      });
      return c.json(data, { status: 200 });
    },
  );
}
