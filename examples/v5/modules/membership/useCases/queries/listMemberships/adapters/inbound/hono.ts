import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { PipelineEnv } from "@arts-and-crafts/v5-hono";
import {
  parseQueryMiddleware,
  correlationIdMiddleware,
  causationIdMiddleware,
} from "@arts-and-crafts/v5-hono";
import { runQuery } from "@arts-and-crafts/v5-utils/useCases/query";
import { resolveError } from "@arts-and-crafts/v5-utils/adapters/inbound";
import type { LoadProjection } from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { ListMembershipsProjection } from "../../projection.ts";
import {
  createListMembershipsQuery,
  listMembershipsQueryPayload,
  type ListMembershipsQueryPayload,
} from "../../query.ts";
import { ListMembershipsHandler } from "../../handler.ts";
import { listMembershipsHooks } from "./hooks.ts";

export function createListMembershipsHonoHandler(store: LoadProjection<ListMembershipsProjection>) {
  const handler = new ListMembershipsHandler(store);

  const app = new Hono<PipelineEnv>();

  app.get(
    "/",
    parseQueryMiddleware(listMembershipsQueryPayload),
    correlationIdMiddleware(),
    causationIdMiddleware(),
    async (c) => {
      const data = await runQuery(createListMembershipsQuery, handler)(
        c.get("payload") as ListMembershipsQueryPayload,
        { correlationId: c.get("correlationId"), causationId: c.get("causationId") },
      );
      return c.json(data, { status: 200 });
    },
  );

  app.onError((err, c) => {
    const outcome = resolveError(err, listMembershipsHooks);
    return c.json(outcome.body, { status: outcome.status as ContentfulStatusCode });
  });

  return app;
}
