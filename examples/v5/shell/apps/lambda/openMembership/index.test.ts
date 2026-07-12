import type { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { handler } from "./index.ts";

function buildEvent(body: unknown, headers: Record<string, string> = {}): APIGatewayProxyEventV2 {
  return { headers, body: JSON.stringify(body) } as unknown as APIGatewayProxyEventV2;
}

const CONTEXT = {} as Context;

// This file's handler is module-scoped (matching warm-container reuse in a
// real Lambda), so its InMemory event store persists across the tests below
// — each test uses a unique email to avoid cross-test contamination.
describe("openMembership Lambda handler", () => {
  it("returns 202 with accepted:true and a server-generated id on success", async () => {
    const res = await handler(
      buildEvent({ name: "John Doe", email: "success@example.com" }),
      CONTEXT,
    );
    expect(res.statusCode).toBe(202);
    const body = JSON.parse(res.body as string);
    expect(body.accepted).toBe(true);
    expect(body.id).toEqual(expect.any(String));
  });

  it("returns 400 when the body is invalid", async () => {
    const res = await handler(buildEvent({ email: "invalid@example.com" }), CONTEXT);
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 with {code, reason} when the membership already exists", async () => {
    const body = { name: "John Doe", email: "duplicate@example.com" };
    await handler(buildEvent(body), CONTEXT);
    const res = await handler(buildEvent(body), CONTEXT);
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body as string)).toEqual({
      code: "MEMBERSHIP_ALREADY_EXISTS",
      reason: "Membership already exists",
    });
  });
});
