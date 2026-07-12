import type { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { handler } from "./index.ts";

function buildEvent(query: Record<string, string> = {}): APIGatewayProxyEventV2 {
  return { headers: {}, queryStringParameters: query } as unknown as APIGatewayProxyEventV2;
}

const CONTEXT = {} as Context;

describe("listMemberships Lambda handler", () => {
  it("returns 200 with an empty array when there are no memberships", async () => {
    const res = await handler(buildEvent(), CONTEXT);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body as string)).toEqual([]);
  });

  it("returns 400 for an invalid status query param", async () => {
    const res = await handler(buildEvent({ status: "bogus" }), CONTEXT);
    expect(res.statusCode).toBe(400);
  });
});
