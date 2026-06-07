import { InMemoryEmailGateway } from "@examples/shared/adapters/outbound/EmailGateway.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import { NotifyUserToVerifyEmailHandler } from "./handler.ts";
import { randomUUID } from "node:crypto";
import { membershipTag } from "@examples/modules/membership/core/tags.ts";
import { OPEN_MEMBERSHIP } from "../../commands/openMembership/command.ts";

const makeIntent = (): NotifyUserToVerifyEmailV1 => ({
  kind: "intent",
  type: "NotifyUserToVerifyEmail.v1",
  id: randomUUID(),
  timestamp: Date.now(),
  tags: [membershipTag(randomUUID())],
  commandId: randomUUID(),
  commandType: OPEN_MEMBERSHIP,
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  payload: {
    email: "jane@example.com",
    name: "Jane Doe",
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
