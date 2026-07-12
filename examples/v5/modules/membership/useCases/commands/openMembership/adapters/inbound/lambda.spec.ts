import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { v7 as uuidv7 } from "uuid";
import { createOpenMembershipInboundLambdaAdapter } from "./lambda.ts";
import type { OpenMembershipCommand } from "../../command.ts";
import type { OpenMembershipHandler } from "../../handler.ts";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { Rejection } from "@arts-and-crafts/v5/core/shapes";

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

function event(body: unknown, headers: Record<string, string> = {}): APIGatewayProxyEventV2 {
  return {
    headers,
    body: JSON.stringify(body),
  } as unknown as APIGatewayProxyEventV2;
}

describe("createOpenMembershipInboundLambdaAdapter", () => {
  let handledCommands: OpenMembershipCommand[];
  let handlerResult: GatewayFailure[] | Rejection;
  let handler: OpenMembershipHandler;
  let invoke: ReturnType<typeof createOpenMembershipInboundLambdaAdapter>;

  beforeEach(() => {
    handledCommands = [];
    handlerResult = [];
    handler = {
      handle: async (cmd: OpenMembershipCommand) => {
        handledCommands.push(cmd);
        return handlerResult;
      },
    } as unknown as OpenMembershipHandler;
    invoke = createOpenMembershipInboundLambdaAdapter(handler);
  });

  it("returns 202 with accepted:true and a UUIDv7 command id on success", async () => {
    const res = await invoke(event(VALID_BODY));
    const json = JSON.parse(res.body as string);
    expect(res.statusCode).toBe(202);
    expect(json.accepted).toBe(true);
    expect(json.id).toMatch(UUID_V7_PATTERN);
  });

  it("returns 404 with accepted:false and rejection code when command is rejected", async () => {
    handlerResult = REJECTION;
    const res = await invoke(event(VALID_BODY));
    const json = JSON.parse(res.body as string);
    expect(res.statusCode).toBe(404);
    expect(json).toEqual({ accepted: false, code: "MEMBERSHIP_ALREADY_EXISTS" });
  });

  it("returns 500 when handler returns gateway failures", async () => {
    handlerResult = [GATEWAY_FAILURE];
    const res = await invoke(event(VALID_BODY));
    const json = JSON.parse(res.body as string);
    expect(res.statusCode).toBe(500);
    expect(json).toEqual({ code: "UNEXPECTED_SERVER_ERROR" });
  });

  it("returns 400 when name is missing", async () => {
    const res = await invoke(event({ email: "john@example.com" }));
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for an invalid email", async () => {
    const res = await invoke(event({ ...VALID_BODY, email: "not-an-email" }));
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when body is absent", async () => {
    const res = await invoke({ headers: {} } as unknown as APIGatewayProxyEventV2);
    expect(res.statusCode).toBe(400);
  });

  it("generates a new membershipId server-side", async () => {
    await invoke(event(VALID_BODY));
    expect(handledCommands[0].payload.membershipId).toMatch(UUID_V7_PATTERN);
  });

  it("uses x-correlation-id header as correlationId when present", async () => {
    const correlationId = uuidv7();
    await invoke(event(VALID_BODY, { "x-correlation-id": correlationId }));
    expect(handledCommands[0].metadata.correlationId).toBe(correlationId);
  });

  it("uses x-request-id header as causationId when present", async () => {
    const causationId = uuidv7();
    await invoke(event(VALID_BODY, { "x-request-id": causationId }));
    expect(handledCommands[0].metadata.causationId).toBe(causationId);
  });

  it("generates a UUIDv7 correlationId when x-correlation-id header is absent", async () => {
    await invoke(event(VALID_BODY));
    expect(handledCommands[0].metadata.correlationId).toMatch(UUID_V7_PATTERN);
  });

  it("generates a UUIDv7 causationId when x-request-id header is absent", async () => {
    await invoke(event(VALID_BODY));
    expect(handledCommands[0].metadata.causationId).toMatch(UUID_V7_PATTERN);
  });
});
