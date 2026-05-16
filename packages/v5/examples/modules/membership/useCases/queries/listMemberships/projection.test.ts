import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import { randomUUID } from "node:crypto";
import { apply, emptyProjection, type ListMembershipsProjection } from "./projection.ts";

const makeOpened = (overrides: Partial<MembershipOpenedV1["payload"]> = {}): MembershipOpenedV1 => ({
  type: "MembershipOpened.v1",
  kind: "domain",
  aggregateType: "Membership",
  aggregateId: overrides.aggregateId ?? randomUUID(),
  timestamp: Date.now(),
  id: randomUUID(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  payload: {
    aggregateId: overrides.aggregateId ?? randomUUID(),
    name: overrides.name ?? "Ada Lovelace",
    email: overrides.email ?? "ada@example.com",
  },
});

describe("listMemberships projection", () => {
  it("starts with an empty byId map", () => {
    expect(emptyProjection).toEqual({ byId: {} });
  });

  it("adds an entry for MembershipOpened.v1", () => {
    const id = randomUUID();
    const event = makeOpened({
      aggregateId: id,
      name: "Ada Lovelace",
      email: "ada@example.com",
    });

    const next = apply(emptyProjection, event);

    expect(next.byId[id]).toEqual({
      id,
      name: "Ada Lovelace",
      email: "ada@example.com",
      status: "open",
    });
  });

  it("preserves existing entries when applying a new event", () => {
    const firstId = randomUUID();
    const secondId = randomUUID();
    const afterFirst = apply(emptyProjection, makeOpened({ aggregateId: firstId }));
    const afterSecond = apply(afterFirst, makeOpened({ aggregateId: secondId }));

    expect(Object.keys(afterSecond.byId)).toEqual(expect.arrayContaining([firstId, secondId]));
  });

  it("returns the same state reference for unrecognised events", () => {
    const unknown: MembershipEventV1 = {
      ...makeOpened(),
      type: "Unknown.v1",
    } as unknown as MembershipEventV1;
    const state: ListMembershipsProjection = { byId: {} };
    expect(apply(state, unknown)).toBe(state);
  });
});
