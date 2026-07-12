import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { v7 as uuidv7 } from "uuid";
import { createListMembershipsInboundLambdaAdapter } from "./lambda.ts";
import type { ListMembershipsQuery } from "../../query.ts";
import type { MembershipSummary } from "../../projection.ts";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { HandleQuery } from "@arts-and-crafts/v5/useCases/query/capabilities";

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

function event(
  params: Record<string, string> = {},
  headers: Record<string, string> = {},
): APIGatewayProxyEventV2 {
  return {
    headers,
    queryStringParameters: params,
  } as unknown as APIGatewayProxyEventV2;
}

describe("createListMembershipsInboundLambdaAdapter", () => {
  let handledQueries: ListMembershipsQuery[];
  let handlerResult: MembershipSummary[] | GatewayFailure;
  let handler: HandleQuery<ListMembershipsQuery, Promise<MembershipSummary[] | GatewayFailure>>;
  let invoke: ReturnType<typeof createListMembershipsInboundLambdaAdapter>;

  beforeEach(() => {
    handledQueries = [];
    handlerResult = [];
    handler = {
      handle: async (query: ListMembershipsQuery) => {
        handledQueries.push(query);
        return handlerResult;
      },
    };
    invoke = createListMembershipsInboundLambdaAdapter(handler);
  });

  it("returns 200 with memberships from the handler", async () => {
    handlerResult = [MEMBERSHIP_SUMMARY];
    const res = await invoke(event());
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body as string)).toEqual([MEMBERSHIP_SUMMARY]);
  });

  it("returns 200 with an empty array when handler returns no memberships", async () => {
    const res = await invoke(event());
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body as string)).toEqual([]);
  });

  it("returns 503 with error reason when handler returns a gateway failure", async () => {
    handlerResult = GATEWAY_FAILURE;
    const res = await invoke(event());
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body as string)).toEqual({ error: GATEWAY_FAILURE.reason });
  });

  it("returns 400 for an invalid status query param", async () => {
    const res = await invoke(event({ status: "invalid" }));
    expect(res.statusCode).toBe(400);
  });

  it("treats a missing queryStringParameters object as an empty payload", async () => {
    const res = await invoke({ headers: {} } as unknown as APIGatewayProxyEventV2);
    expect(res.statusCode).toBe(200);
  });

  it("calls handler with the query payload including status when provided", async () => {
    await invoke(event({ status: "open" }));
    expect(handledQueries).toHaveLength(1);
    expect(handledQueries[0].payload.status).toBe("open");
  });

  it("calls handler with undefined status when omitted", async () => {
    await invoke(event());
    expect(handledQueries[0].payload.status).toBeUndefined();
  });

  it("uses x-correlation-id header as correlationId when present", async () => {
    const correlationId = uuidv7();
    await invoke(event({}, { "x-correlation-id": correlationId }));
    expect(handledQueries[0].metadata.correlationId).toBe(correlationId);
  });

  it("uses x-request-id header as causationId when present", async () => {
    const causationId = uuidv7();
    await invoke(event({}, { "x-request-id": causationId }));
    expect(handledQueries[0].metadata.causationId).toBe(causationId);
  });

  it("generates a UUIDv7 correlationId when x-correlation-id header is absent", async () => {
    await invoke(event());
    expect(handledQueries[0].metadata.correlationId).toMatch(UUID_V7_PATTERN);
  });

  it("generates a UUIDv7 causationId when x-request-id header is absent", async () => {
    await invoke(event());
    expect(handledQueries[0].metadata.causationId).toMatch(UUID_V7_PATTERN);
  });
});
