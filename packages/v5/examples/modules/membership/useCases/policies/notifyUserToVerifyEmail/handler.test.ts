import { InMemoryEmailGateway } from "@examples/shared/adapters/outbound/EmailGateway.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import { NotifyUserToVerifyEmailHandler } from "./handler.ts";
import { randomUUID } from "node:crypto";

const makeIntent = (
  overrides: Partial<NotifyUserToVerifyEmailV1["payload"]> = {},
): NotifyUserToVerifyEmailV1 => ({
  kind: "intent",
  type: "NotifyUserToVerifyEmail.v1",
  id: randomUUID(),
  timestamp: Date.now(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  payload: {
    aggregateId: randomUUID(),
    email: "jane@example.com",
    name: "Jane Doe",
    ...overrides,
  },
});

describe("NotifyUserToVerifyEmailHandler", () => {
  let gateway: InMemoryEmailGateway;
  let handler: NotifyUserToVerifyEmailHandler;

  beforeEach(() => {
    gateway = new InMemoryEmailGateway();
    handler = new NotifyUserToVerifyEmailHandler(gateway);
  });

  it("should send an email with payload-derived fields and the intent id as idempotency key", async () => {
    const intent = makeIntent();

    await handler.handle(intent);

    expect(gateway.sent).toEqual([
      {
        to: intent.payload.email,
        subject: "Please verify your email",
        body: `Hi ${intent.payload.name}, click to verify your email.`,
        idempotencyKey: intent.id,
      },
    ]);
  });

  it("should propagate exceptions thrown by the gateway", async () => {
    gateway.simulate("offline");
    await expect(handler.handle(makeIntent())).rejects.toThrow("EmailGateway is offline");
  });
});
