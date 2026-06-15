import { Hono } from "hono";
import { v7 as uuidv7 } from "uuid";
import { createListMembershipsInboundHonoAdapter } from "./hono.ts";
import type { ListMembershipsQuery } from "../../query.ts";
import type { MembershipSummary } from "../../projection.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { HandleQuery } from "@useCases/query/capabilities/HandleQuery.ts";

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MEMBERSHIP_SUMMARY: MembershipSummary = {
  id: "Membership#membership-123",
  name: "John Doe",
  email: "john@example.com",
  status: "open",
};

const GATEWAY_FAILURE: GatewayFailure = {
  kind: "failure",
  code: "GATEWAY_FAILURE",
  gateway: "EventStore",
  reason: "Connection refused",
};

describe("createListMembershipsInboundHonoAdapter", () => {
  let handledQueries: ListMembershipsQuery[];
  let handlerResult: MembershipSummary[] | GatewayFailure;
  let handler: HandleQuery<ListMembershipsQuery, Promise<MembershipSummary[] | GatewayFailure>>;
  let app: Hono;

  beforeEach(() => {
    handledQueries = [];
    handlerResult = [];
    handler = {
      handle: async (query: ListMembershipsQuery) => {
        handledQueries.push(query);
        return handlerResult;
      },
    };
    app = new Hono();
    app.route("/", createListMembershipsInboundHonoAdapter(handler));
  });

  function get(params: Record<string, string> = {}, headers: Record<string, string> = {}) {
    const url = `/memberships${Object.keys(params).length ? `?${new URLSearchParams(params)}` : ""}`;
    return app.request(url, { headers });
  }

  it("returns 200 with memberships from the handler", async () => {
    handlerResult = [MEMBERSHIP_SUMMARY];
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([MEMBERSHIP_SUMMARY]);
  });

  it("returns 200 with an empty array when handler returns no memberships", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns 503 with error reason when handler returns a gateway failure", async () => {
    handlerResult = GATEWAY_FAILURE;
    const res = await get();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: GATEWAY_FAILURE.reason });
  });

  it("returns 400 for an invalid status query param", async () => {
    const res = await get({ status: "invalid" });
    expect(res.status).toBe(400);
  });

  it("calls handler with the query payload including status when provided", async () => {
    await get({ status: "open" });
    expect(handledQueries).toHaveLength(1);
    expect(handledQueries[0].payload.status).toBe("open");
  });

  it("calls handler with undefined status when omitted", async () => {
    await get();
    expect(handledQueries[0].payload.status).toBeUndefined();
  });

  it("uses X-Correlation-ID header as correlationId when present", async () => {
    const correlationId = uuidv7();
    await get({}, { "X-Correlation-ID": correlationId });
    expect(handledQueries[0].metadata.correlationId).toBe(correlationId);
  });

  it("uses X-Request-ID header as causationId when present", async () => {
    const causationId = uuidv7();
    await get({}, { "X-Request-ID": causationId });
    expect(handledQueries[0].metadata.causationId).toBe(causationId);
  });

  it("generates a UUIDv7 correlationId when X-Correlation-ID header is absent", async () => {
    await get();
    expect(handledQueries[0].metadata.correlationId).toMatch(UUID_V7_PATTERN);
  });

  it("generates a UUIDv7 causationId when X-Request-ID header is absent", async () => {
    await get();
    expect(handledQueries[0].metadata.causationId).toMatch(UUID_V7_PATTERN);
  });
});
