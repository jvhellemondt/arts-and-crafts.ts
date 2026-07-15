import type { Context } from "hono";
import { readQueryParams, readHeaders, respond } from "@arts-and-crafts/v5-hono";
import { runQuery } from "@arts-and-crafts/v5-utils/useCases/query";
import {
  parsePayload,
  correlationIdFromHeaders,
  causationIdFromHeaders,
  resolveError,
} from "@arts-and-crafts/v5-utils/adapters/inbound";
import type { LoadProjection } from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { ListMembershipsProjection } from "../../projection.ts";
import { createListMembershipsQuery, listMembershipsQueryPayload } from "../../query.ts";
import { ListMembershipsHandler } from "../../handler.ts";
import { listMembershipsHooks } from "./hooks.ts";

export function createListMembershipsHonoHandler(store: LoadProjection<ListMembershipsProjection>) {
  const handler = new ListMembershipsHandler(store);

  return (c: Context) => {
    const headers = readHeaders(c);
    const metadata = {
      correlationId: correlationIdFromHeaders(headers),
      causationId: causationIdFromHeaders(headers),
    };
    return parsePayload(listMembershipsQueryPayload, readQueryParams(c))
      .map((payload) => createListMembershipsQuery(payload, metadata))
      .asyncAndThen((query) => runQuery(query, handler))
      .match(
        (data) => c.json(data, 200),
        (error) => respond(c, resolveError(error, listMembershipsHooks)),
      );
  };
}
