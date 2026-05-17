import { Hono } from "hono";
import type { ListMembershipsHonoAdapter } from "@examples/modules/membership/useCases/queries/listMemberships/adapters/inbound/hono.ts";
import { listMembershipsQueryPayload } from "@examples/modules/membership/useCases/queries/listMemberships/query.ts";
import { sValidator } from "@hono/standard-validator";

export function createListMembershipsRoute(adapter: ListMembershipsHonoAdapter) {
  const route = new Hono();
  route.get("memberships", sValidator("query", listMembershipsQueryPayload), async (c) => adapter.handle(c));
  return route;
}
