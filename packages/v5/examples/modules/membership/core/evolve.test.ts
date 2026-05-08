import { randomUUID } from "node:crypto";
import type { MembershipOpenedV1 } from "./events/v1/MembershipOpenedV1.ts";
import { evolveMembership } from "./evolve.ts";

const makeMembershipOpenedV1 = (aggregateId: string): MembershipOpenedV1 => ({
  type: "MembershipOpened.v1",
  kind: "domain",
  aggregateType: "Membership",
  aggregateId,
  timestamp: Date.now(),
  id: randomUUID(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  payload: { aggregateId, name: "Jane Doe", email: "jane@example.com" },
});

describe("evolveMembership", () => {
  const aggregateId = randomUUID();

  it("returns the initial state when given no events", () => {
    const state = evolveMembership(aggregateId, []);
    expect(state).toEqual({ status: "initial", id: aggregateId });
  });

  it("ignores unknown event types and returns the current state", () => {
    const unknown = { type: "Unknown.v1" } as unknown as MembershipOpenedV1;
    const state = evolveMembership(aggregateId, [unknown]);
    expect(state).toEqual({ status: "initial", id: aggregateId });
  });

  describe("MembershipOpened.v1", () => {
    it("transitions to open status", () => {
      const state = evolveMembership(aggregateId, [makeMembershipOpenedV1(aggregateId)]);
      expect(state.status).toBe("open");
    });

    it("sets name and email from the event payload", () => {
      const state = evolveMembership(aggregateId, [makeMembershipOpenedV1(aggregateId)]);
      if (state.status !== "open") return;
      expect(state.name).toBe("Jane Doe");
      expect(state.email).toBe("jane@example.com");
    });

    it("preserves the aggregate id", () => {
      const state = evolveMembership(aggregateId, [makeMembershipOpenedV1(aggregateId)]);
      expect(state.id).toBe(aggregateId);
    });
  });
});
