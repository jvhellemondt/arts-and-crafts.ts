import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { InMemoryProjectionStore } from "@examples/shared/adapters/outbound/ProjectionStore.InMemory.ts";
import { ListMembershipsHandler } from "../../handler.ts";
import type { ListMembershipsProjection, MembershipSummary } from "../../projection.ts";
import { createListMembershipsLambdaHandler } from "./lambda.ts";

function buildEvent(query: Record<string, string> = {}): APIGatewayProxyEventV2 {
  return { headers: {}, queryStringParameters: query } as unknown as APIGatewayProxyEventV2;
}

describe("createListMembershipsLambdaHandler", () => {
  let store: InMemoryProjectionStore<ListMembershipsProjection>;
  let invoke: ReturnType<typeof createListMembershipsLambdaHandler>;

  beforeEach(() => {
    store = new InMemoryProjectionStore<ListMembershipsProjection>({});
    invoke = createListMembershipsLambdaHandler(new ListMembershipsHandler(store));
  });

  it("returns 200 with the matching memberships", async () => {
    const summary: MembershipSummary = {
      id: "Membership#abc",
      name: "Ada Lovelace",
      email: "ada@example.com",
      status: "open",
    };
    await store.save({ [summary.id]: summary });
    const res = await invoke(buildEvent({ status: "open" }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body as string)).toEqual([summary]);
  });

  it("returns 400 for an invalid status query param", async () => {
    const res = await invoke(buildEvent({ status: "bogus" }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body as string)).toMatchObject({ code: "PARSE_FAILED" });
  });

  it("returns 503 when the projection store is offline", async () => {
    store.simulate("offline");
    const res = await invoke(buildEvent());
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body as string)).toMatchObject({ code: "GATEWAY_FAILURE" });
  });

  it("defaults headers and query params when the event omits them", async () => {
    const res = await invoke({} as unknown as APIGatewayProxyEventV2);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body as string)).toEqual([]);
  });
});
