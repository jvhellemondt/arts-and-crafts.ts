import { Hono } from "hono";
import { createOpenMembershipHonoHandler } from "./hono.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryOutbox } from "@examples/shared/adapters/outbound/Outbox.InMemory.ts";
import { InMemoryDatasource } from "@examples/shared/adapters/outbound/InMemoryDatasource.ts";
import { InMemoryTransactionalWriter } from "@examples/shared/adapters/outbound/TransactionalWriter.InMemory.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import type { OpenMembershipRejected } from "../../rejections/MembershipAlreadyExists.ts";

const VALID_PAYLOAD = {
  name: "Alice",
  email: "alice@example.com",
};

const post = (app: Hono, body?: string) =>
  app.request("/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

describe("createOpenMembershipHonoHandler", () => {
  let app: Hono;
  let eventStore: InMemoryEventStore<MembershipEventV1>;
  let outbox: InMemoryOutbox<NotifyUserToVerifyEmailV1, OpenMembershipRejected>;

  beforeEach(() => {
    const datasource = new InMemoryDatasource();
    eventStore = new InMemoryEventStore<MembershipEventV1>(datasource);
    outbox = new InMemoryOutbox<NotifyUserToVerifyEmailV1, OpenMembershipRejected>(datasource);
    const writer = new InMemoryTransactionalWriter(eventStore, outbox, datasource);
    app = new Hono();
    app.post("/", createOpenMembershipHonoHandler(eventStore, writer, outbox));
  });

  it("returns 202 with the new membership id on success", async () => {
    const res = await post(app, JSON.stringify(VALID_PAYLOAD));
    expect(res.status).toBe(202);
    const json = await res.json();
    expect(json).toMatchObject({ accepted: true });
    expect(typeof json.id).toBe("string");
  });

  it("returns 409 when a membership with the same email already exists", async () => {
    await post(app, JSON.stringify(VALID_PAYLOAD));
    const res = await post(app, JSON.stringify(VALID_PAYLOAD));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: "MEMBERSHIP_ALREADY_EXISTS" });
  });

  it("returns 400 when the payload fails schema validation", async () => {
    const res = await post(app, JSON.stringify({ name: "Alice", email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: "PARSE_FAILED" });
  });

  it("returns 400 when the body is empty", async () => {
    const res = await post(app, JSON.stringify({}));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: "NO_BODY" });
  });

  it("returns 503 when the event store is offline", async () => {
    eventStore.simulate("offline");
    const res = await post(app, JSON.stringify(VALID_PAYLOAD));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ code: "GATEWAY_FAILURE" });
  });
});
