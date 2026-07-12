import { createHonoApp } from "./index.ts";
import {
  InMemoryEventStore,
  type TableName,
  type TableRow,
} from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryOutbox } from "@examples/shared/adapters/outbound/Outbox.InMemory.ts";
import { InMemoryProjectionStore } from "@examples/shared/adapters/outbound/ProjectionStore.InMemory.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { MembershipIntents } from "@examples/modules/membership/core/intents/index.ts";
import type { OpenMembershipRejected } from "@examples/modules/membership/useCases/commands/openMembership/rejections/MembershipAlreadyExists.ts";
import {
  emptyProjection,
  type ListMembershipsProjection,
  type MembershipSummary,
} from "@examples/modules/membership/useCases/queries/listMemberships/projection.ts";

function buildApp() {
  const eventStore = new InMemoryEventStore<MembershipEventV1>(
    new Map<TableName, TableRow<MembershipEventV1>[]>(),
  );
  const outbox = new InMemoryOutbox<MembershipIntents, OpenMembershipRejected>();
  const listMembershipsStore = new InMemoryProjectionStore<ListMembershipsProjection>(
    emptyProjection,
  );
  const app = createHonoApp(eventStore, outbox, listMembershipsStore);
  return { app, eventStore, outbox, listMembershipsStore };
}

describe("POST /membership/open", () => {
  it("returns 202 with accepted:true and a server-generated id on success", async () => {
    const { app } = buildApp();
    const res = await app.request("/membership/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "John Doe", email: "john@example.com" }),
    });
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.accepted).toBe(true);
    expect(body.id).toEqual(expect.any(String));
  });

  it("returns 400 with the validation error when the body is invalid", async () => {
    const { app } = buildApp();
    const res = await app.request("/membership/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "john@example.com" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 with {code, reason} when the membership already exists", async () => {
    const { app } = buildApp();
    const body = { name: "John Doe", email: "john@example.com" };
    await app.request("/membership/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const res = await app.request("/membership/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      code: "MEMBERSHIP_ALREADY_EXISTS",
      reason: "Membership already exists",
    });
  });

  it("returns 500 with {code, reason} when the event store is offline", async () => {
    const { app, eventStore } = buildApp();
    eventStore.simulate("offline");
    const res = await app.request("/membership/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "John Doe", email: "john@example.com" }),
    });
    expect(res.status).toBe(500);
    const responseBody = await res.json();
    expect(responseBody.code).toBe("GATEWAY_FAILURE");
  });
});

describe("GET /memberships", () => {
  it("returns 200 with an empty array when there are no memberships", async () => {
    const { app } = buildApp();
    const res = await app.request("/memberships");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns 200 with memberships filtered by status", async () => {
    const { app, listMembershipsStore } = buildApp();
    const summary: MembershipSummary = {
      id: "Membership#abc",
      name: "Ada Lovelace",
      email: "ada@example.com",
      status: "open",
    };
    await listMembershipsStore.save({ [summary.id]: summary });
    const res = await app.request("/memberships?status=open");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([summary]);
  });

  it("returns 400 for an invalid status query param", async () => {
    const { app } = buildApp();
    const res = await app.request("/memberships?status=bogus");
    expect(res.status).toBe(400);
  });

  it("returns 503 with {code, reason} when the projection store is offline", async () => {
    const { app, listMembershipsStore } = buildApp();
    listMembershipsStore.simulate("offline");
    const res = await app.request("/memberships");
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe("GATEWAY_FAILURE");
  });
});
