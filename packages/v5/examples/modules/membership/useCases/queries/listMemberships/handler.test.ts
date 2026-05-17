import type { LoadProjection } from "@adapters/outbound/capabilities/LoadProjection.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import { randomUUID } from "node:crypto";
import { ListMembershipsHandler } from "./handler.ts";
import type { ListMembershipsProjection, MembershipSummary } from "./projection.ts";
import { createListMembershipsQuery, listMembershipsQueryPayload } from "./query.ts";

const makeQuery = (status?: "open" | "initial" | "active" | "closed") =>
  createListMembershipsQuery(listMembershipsQueryPayload.parse({ status }), {
    correlationId: randomUUID(),
    causationId: randomUUID(),
  });

const makeSummary = (overrides: Partial<MembershipSummary> = {}): MembershipSummary => ({
  id: overrides.id ?? randomUUID(),
  name: overrides.name ?? "Ada Lovelace",
  email: overrides.email ?? "ada@example.com",
  status: "open",
});

const makeLoader = (
  state: ListMembershipsProjection | GatewayFailure,
): LoadProjection<ListMembershipsProjection> => ({
  async load() {
    return state;
  },
});

describe("ListMembershipsHandler", () => {
  it("returns an empty list when the projection is empty", async () => {
    const handler = new ListMembershipsHandler(makeLoader({}));
    const result = await handler.handle(makeQuery("open"));
    expect(result).toEqual([]);
  });

  it("returns memberships matching the requested status", async () => {
    const a = makeSummary();
    const b = makeSummary();
    const handler = new ListMembershipsHandler(makeLoader({ [a.id]: a, [b.id]: b }));
    const result = await handler.handle(makeQuery("open"));
    expect(result).toEqual(expect.arrayContaining([a, b]));
    expect(result).toHaveLength(2);
  });

  it("returns an empty list when no memberships match the status filter", async () => {
    const a = makeSummary();
    const handler = new ListMembershipsHandler(makeLoader({ [a.id]: a }));
    const result = await handler.handle(makeQuery("active"));
    expect(result).toEqual([]);
  });

  it("returns an empty list when status is undefined", async () => {
    const a = makeSummary();
    const handler = new ListMembershipsHandler(makeLoader({ [a.id]: a }));
    const result = await handler.handle(makeQuery());
    expect(result).toEqual([]);
  });

  it("surfaces a GatewayFailure from the projection store", async () => {
    const failure: GatewayFailure = {
      type: "failure",
      kind: "GatewayFailure",
      gateway: "InMemoryProjectionStore",
      reason: "offline",
    };
    const handler = new ListMembershipsHandler(makeLoader(failure));
    const result = await handler.handle(makeQuery("open"));
    expect(result).toEqual(failure);
  });
});
