import { Hono } from "hono";
import { createOpenMembershipHonoHandler } from "./hono.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryOutbox } from "@examples/shared/adapters/outbound/Outbox.InMemory.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";

const VALID_PAYLOAD = {
  name: "Alice",
  email: "alice@example.com",
};

describe("runs the adapter", () => {
  let app: Hono;
  let eventStore: InMemoryEventStore<MembershipEventV1>;
  let outbox: InMemoryOutbox<NotifyUserToVerifyEmailV1, never>;

  beforeEach(() => {
    eventStore = new InMemoryEventStore<MembershipEventV1>();
    outbox = new InMemoryOutbox<NotifyUserToVerifyEmailV1, never>();
    const adapter = createOpenMembershipHonoHandler(eventStore, outbox);
    app = new Hono();
    app.post("/", adapter);
  });

  it("returns ", async () => {
    const res = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_PAYLOAD),
    });
    const json = await res.json();
    console.log(json);
  });
});
