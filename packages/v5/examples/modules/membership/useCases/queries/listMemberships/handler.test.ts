import type { LoadProjection } from "@adapters/outbound/capabilities/LoadProjection.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import { randomUUID } from "node:crypto";
import { ListMembershipsHandler } from "./handler.ts";
import type { ListMembershipsProjection, MembershipSummary } from "./projection.ts";
import { createListMembershipsQuery } from "./queries.ts";

const makeQuery = () =>
  createListMembershipsQuery({ correlationId: randomUUID(), causationId: randomUUID() });

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
    const handler = new ListMembershipsHandler(makeLoader({ byId: {} }));
    const result = await handler.handle(makeQuery());
    expect(result).toEqual([]);
  });

  it("returns the values of the projection's byId map", async () => {
    const a = makeSummary();
    const b = makeSummary();
    const handler = new ListMembershipsHandler(makeLoader({ byId: { [a.id]: a, [b.id]: b } }));
    const result = await handler.handle(makeQuery());
    expect(result).toEqual(expect.arrayContaining([a, b]));
    expect(result).toHaveLength(2);
  });

  it("surfaces a GatewayFailure from the projection store", async () => {
    const failure: GatewayFailure = {
      type: "failure",
      kind: "GatewayFailure",
      gateway: "InMemoryProjectionStore",
      reason: "offline",
    };
    const handler = new ListMembershipsHandler(makeLoader(failure));
    const result = await handler.handle(makeQuery());
    expect(result).toEqual(failure);
  });
});
