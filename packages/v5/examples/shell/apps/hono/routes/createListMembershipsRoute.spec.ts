import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { HandleQuery } from "@useCases/query/capabilities/HandleQuery.ts";
import { ListMembershipsHonoAdapter } from "@examples/modules/membership/useCases/queries/listMemberships/adapters/inbound/hono.ts";
import type { MembershipSummary } from "@examples/modules/membership/useCases/queries/listMemberships/projection.ts";
import type { ListMembershipsQuery } from "@examples/modules/membership/useCases/queries/listMemberships/query.ts";
import { randomUUID } from "node:crypto";
import { createListMembershipsRoute } from "./createListMembershipsRoute.ts";

function makeRequest() {
  return new Request("http://localhost/memberships", { method: "GET" });
}

describe("createListMembershipsRoute", () => {
  let result: MembershipSummary[] | GatewayFailure;
  let handler: HandleQuery<ListMembershipsQuery, Promise<MembershipSummary[] | GatewayFailure>>;
  let route: ReturnType<typeof createListMembershipsRoute>;

  beforeEach(() => {
    result = [];
    handler = {
      async handle() {
        return result;
      },
    };
    route = createListMembershipsRoute(new ListMembershipsHonoAdapter(handler));
  });

  it("returns 200 when the handler succeeds", async () => {
    const res = await route.request(makeRequest());
    expect(res.status).toBe(200);
  });

  it("returns the list as JSON in the response body", async () => {
    const summary: MembershipSummary = {
      id: randomUUID(),
      name: "Ada Lovelace",
      email: "ada@example.com",
      status: "open",
    };
    result = [summary];
    const res = await route.request(makeRequest());
    const body = await res.json();
    expect(body).toEqual([summary]);
  });

  it("returns 503 when the handler returns a GatewayFailure", async () => {
    result = {
      type: "failure",
      kind: "GatewayFailure",
      gateway: "InMemoryProjectionStore",
      reason: "offline",
    };
    const res = await route.request(makeRequest());
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual({ error: "offline" });
  });
});
