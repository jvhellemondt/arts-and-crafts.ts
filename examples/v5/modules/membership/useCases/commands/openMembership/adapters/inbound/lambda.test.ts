import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryOutbox } from "@examples/shared/adapters/outbound/Outbox.InMemory.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import { OpenMembershipHandler } from "../../handler.ts";
import { OpenMembershipRepository } from "../../repository.ts";
import { createOpenMembershipLambdaHandler } from "./lambda.ts";

const VALID_PAYLOAD = { name: "Alice", email: "alice@example.com" };

function buildEvent(body: unknown): APIGatewayProxyEventV2 {
  return {
    headers: {},
    body: body === undefined ? undefined : JSON.stringify(body),
  } as unknown as APIGatewayProxyEventV2;
}

describe("createOpenMembershipLambdaHandler", () => {
  let eventStore: InMemoryEventStore<MembershipEventV1>;
  let outbox: InMemoryOutbox<NotifyUserToVerifyEmailV1, never>;
  let invoke: ReturnType<typeof createOpenMembershipLambdaHandler>;

  beforeEach(() => {
    eventStore = new InMemoryEventStore<MembershipEventV1>();
    outbox = new InMemoryOutbox<NotifyUserToVerifyEmailV1, never>();
    const handler = new OpenMembershipHandler(new OpenMembershipRepository(eventStore), outbox);
    invoke = createOpenMembershipLambdaHandler(handler);
  });

  it("returns 202 with the new membership id on success", async () => {
    const res = await invoke(buildEvent(VALID_PAYLOAD));
    expect(res.statusCode).toBe(202);
    const body = JSON.parse(res.body as string);
    expect(body.accepted).toBe(true);
    expect(typeof body.id).toBe("string");
  });

  it("returns 409 when a membership with the same email already exists", async () => {
    await invoke(buildEvent(VALID_PAYLOAD));
    const res = await invoke(buildEvent(VALID_PAYLOAD));
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body as string)).toMatchObject({ code: "MEMBERSHIP_ALREADY_EXISTS" });
  });

  it("returns 400 when the payload fails schema validation", async () => {
    const res = await invoke(buildEvent({ name: "Alice", email: "not-an-email" }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body as string)).toMatchObject({ code: "PARSE_FAILED" });
  });

  it("returns 400 when the body is absent", async () => {
    const res = await invoke(buildEvent(undefined));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body as string)).toMatchObject({ code: "NoBodyError" });
  });

  it("returns 503 when the event store is offline", async () => {
    eventStore.simulate("offline");
    const res = await invoke(buildEvent(VALID_PAYLOAD));
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body as string)).toMatchObject({ code: "GATEWAY_FAILURE" });
  });

  it("defaults the metadata when the event carries no headers", async () => {
    const res = await invoke({
      body: JSON.stringify(VALID_PAYLOAD),
    } as unknown as APIGatewayProxyEventV2);
    expect(res.statusCode).toBe(202);
  });
});
