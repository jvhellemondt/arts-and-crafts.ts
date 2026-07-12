import type { Context } from "hono";
import type { PipelineEnv } from "@arts-and-crafts/v5-hono";
import {
  parseQueryMiddleware,
  correlationIdMiddleware,
  causationIdMiddleware,
} from "@arts-and-crafts/v5-hono";
import { runQuery } from "@arts-and-crafts/v5-utils/useCases/query";
import {
  createListMembershipsQuery,
  listMembershipsQueryPayload,
  type ListMembershipsQueryPayload,
} from "../../query.ts";
import type { ListMembershipsHandler } from "../../handler.ts";

export const listMembershipsHonoMiddleware = [
  parseQueryMiddleware(listMembershipsQueryPayload),
  correlationIdMiddleware(),
  causationIdMiddleware(),
];

export function createListMembershipsHonoHandler(handler: ListMembershipsHandler) {
  return async (c: Context<PipelineEnv>) => {
    const data = await runQuery(createListMembershipsQuery, handler)(
      c.get("payload") as ListMembershipsQueryPayload,
      { correlationId: c.get("correlationId"), causationId: c.get("causationId") },
    );
    return c.json(data, { status: 200 });
  };
}
