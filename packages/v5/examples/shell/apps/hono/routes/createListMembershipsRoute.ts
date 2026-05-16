import { Hono } from "hono";
import type { ListMembershipsHonoAdapter } from "@examples/modules/membership/useCases/queries/listMemberships/adapters/inbound/http.ts";

export function createListMembershipsRoute(adapter: ListMembershipsHonoAdapter) {
  const route = new Hono();
  route.get("memberships", async (c) => adapter.handle(c));
  return route;
}
