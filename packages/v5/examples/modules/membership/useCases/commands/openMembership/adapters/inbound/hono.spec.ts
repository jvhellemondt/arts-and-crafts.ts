import { Hono } from "hono";
import { v7 as uuidv7 } from "uuid";
import { createOpenMembershipInboundHonoAdapter } from "./hono.ts";
import type { OpenMembershipCommand } from "../../command.ts";
import type { OpenMembershipHandler } from "../../handler.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { Rejection } from "@core/shapes/Rejection.ts";

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_BODY = {
  name: "John Doe",
  email: "john@example.com",
};

const REJECTION: Rejection<"MEMBERSHIP_ALREADY_EXISTS"> = {
  kind: "rejection",
  code: "MEMBERSHIP_ALREADY_EXISTS",
  reason: "Membership already exists",
};

const GATEWAY_FAILURE: GatewayFailure = {
  kind: "failure",
  code: "GATEWAY_FAILURE",
  gateway: "EventStore",
  reason: "Connection refused",
};

describe("createOpenMembershipInboundHonoAdapter", () => {
  let handledCommands: OpenMembershipCommand[];
  let handlerResult: GatewayFailure[] | Rejection;
  let handler: OpenMembershipHandler;
  let app: Hono;

  beforeEach(() => {
    handledCommands = [];
    handlerResult = [];
    handler = {
      handle: async (cmd: OpenMembershipCommand) => {
        handledCommands.push(cmd);
        return handlerResult;
      },
    } as unknown as OpenMembershipHandler;
    app = new Hono();
    app.route("/", createOpenMembershipInboundHonoAdapter(handler));
  });

  async function post(body: unknown, headers: Record<string, string> = {}) {
    return app.request("/membership/open", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  }

  it("returns 202 with accepted:true and a UUIDv7 command id on success", async () => {
    const res = await post(VALID_BODY);
    const json = await res.json();
    expect(res.status).toBe(202);
    expect(json.accepted).toBe(true);
    expect(json.id).toMatch(UUID_V7_PATTERN);
  });

  it("returns 404 with accepted:false and rejection code when command is rejected", async () => {
    handlerResult = REJECTION;
    const res = await post(VALID_BODY);
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json).toEqual({ accepted: false, code: "MEMBERSHIP_ALREADY_EXISTS" });
  });

  it("returns 500 when handler returns gateway failures", async () => {
    handlerResult = [GATEWAY_FAILURE];
    const res = await post(VALID_BODY);
    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json).toEqual({ code: "UNEXPECTED_SERVER_ERROR" });
  });

  it("returns 400 when name is missing", async () => {
    const res = await post({ email: "john@example.com" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid email", async () => {
    const res = await post({ ...VALID_BODY, email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  it("generates a new membershipId server-side", async () => {
    await post(VALID_BODY);
    expect(handledCommands[0].payload.membershipId).toMatch(UUID_V7_PATTERN);
  });

  it("uses X-Correlation-ID header as correlationId when present", async () => {
    const correlationId = uuidv7();
    await post(VALID_BODY, { "X-Correlation-ID": correlationId });
    expect(handledCommands[0].metadata.correlationId).toBe(correlationId);
  });

  it("uses X-Request-ID header as causationId when present", async () => {
    const causationId = uuidv7();
    await post(VALID_BODY, { "X-Request-ID": causationId });
    expect(handledCommands[0].metadata.causationId).toBe(causationId);
  });

  it("generates a UUIDv7 correlationId when X-Correlation-ID header is absent", async () => {
    await post(VALID_BODY);
    expect(handledCommands[0].metadata.correlationId).toMatch(UUID_V7_PATTERN);
  });

  it("generates a UUIDv7 causationId when X-Request-ID header is absent", async () => {
    await post(VALID_BODY);
    expect(handledCommands[0].metadata.causationId).toMatch(UUID_V7_PATTERN);
  });
});
